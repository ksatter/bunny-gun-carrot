// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyD2dVnAOrM-rX5aO58F5eR9XFUrlCY0KKA",
    authDomain: "jet-bgc.firebaseapp.com",
    databaseURL: "https://jet-bgc-default-rtdb.firebaseio.com",
    projectId: "jet-bgc",
    storageBucket: "jet-bgc.appspot.com",
    messagingSenderId: "441998858535",
    appId: "1:441998858535:web:2b77352a6fba1bbece3102"
};
// Initialize Firebase and setup refs
firebase.initializeApp(firebaseConfig);
let db = firebase.database()
let gameKey;
let gameRef;
let playerKey;
let playerRef;

let playerName;
let picked;
let opponentName;
let opponentPick;
let flipInterval;


$(document).ready(function () {
    $('.modal').modal();
    $("#player-name").trigger("focus")
    $("#pick").hide()
    $("#game").hide()

    $("#player-name").keyup(function (event) {
        if (event.which !== 13) return false;

        playerName = $(this).val().trim();
        gameSetup()
    })

    $('.choice').click(function () {
        $('#picked').empty().append($(this).clone())
        picked = $(this).attr('id')
        $('#modal1').modal('open')
    })

    $('#confirm').click(function () {
        $('#modal1').modal('close')
        const playerPicked = $(`#${picked}`).closest('.card').clone();
        $('#player-card').children().replaceWith(playerPicked)
        playerRef.set({
            name: playerName,
            choice: picked
        })
        $("#pick").hide()
        $("#game").show()
    })
    $("#stay").click(function () {
        picked = "";
        opponentPick = "";
        playerRef.set({
            name: playerName,
            choice: picked
        })
        $("#modal2").modal("close");
        $("#game").hide();
        $("#pick").show();
    })
});


const gameSetup = async () => {
    const waitingGame = await db.ref("waiting").get()
    const validateWaitingGame = await db.ref(`games/${waitingGame.val()}`).get()

    if (validateWaitingGame.val()) {
        gameKey = waitingGame.val()
        await db.ref("waiting").set(false)
        playerKey = false

    } else {
        if (!gameKey) gameKey = await db.ref("games").push().key;
        db.ref("waiting").set(gameKey)
    }

    gameRef = db.ref(`games/${gameKey}`);

    if (!playerKey) playerKey = await gameRef.push({name: playerName}).key
    
    playerRef = db.ref(`games/${gameKey}/${playerKey}`)
    playerRef.onDisconnect().set(null)
    startGame();
    startWatching();


}

const startGame = () => {
    $('#welcome').hide();
    $('#pick').show();

    $('.player-name').text(playerName)
}


const startWatching = () => {
    gameRef.on('value', snapshot => {
        const snapVal = snapshot.val()
        const opponentKey = Object.keys(snapVal).filter(key => key !== playerKey)
        //check for disconnect from former opponent
        const opponent = opponentKey[0]
        console.log(opponent)
        if (!opponent && opponentName) {
            gameRef.off('value');
            opponentFound = false
            gameSetup()
        } else if (!opponent) {
            waiting()
        }  else if (opponent) {
            opponentChoice = snapVal[opponent].choice;
            opponentName = snapVal[opponent].name
            if(opponentChoice && picked) {
                console.log(picked)
                const playerPicked = $(`#${opponentChoice}`).closest('.card').clone();
                $('#opponent-card').children().replaceWith(playerPicked)
                action();
            }
        }

    })
}

function waiting() {
    console.log('waiting for opponent')
}

const action = () => {
    console.log(opponentChoice, pick)
    if (opponentChoice === picked) {
        end("Tie")
    } else if (picked === "Gun") {
        if (opponentChoice === "Bunny") end ("Win", "scared")
        else if (opponentChoice === "Carrot")  end("Lose", "clogged")
    } else if (picked === "Carrot") {
        if (opponentChoice === "Gun")  end("Win", "clogged")
        else if (opponentChoice === "Bunny") end ("Lose", "ate")
    } else if (picked === "Bunny") {
        if (opponentChoice === "Carrot") end ("Win", "ate")
        else if (opponentChoice === "Gun")  end("Lose", "scared")
    } 
}

function end (state, action) {
    if (state === "Win") {
        $("#pick-text").text(`Your ${picked} ${action} ${opponentName}'s ${opponentChoice}`)
        $("#results-text").text(`You win!`)
        $("#state-img").attr("src", `assets/images/${opponentChoice}-${picked}.png`);

    } else if (state === "Tie"){
        $("#pick-text").text(`You both picked ${picked}`)
        $("#results-text").text(`It's a tie!`)
        $("#state-img").attr("src", `assets/images/${picked}.png`);

    } else {
        $("#pick-text").text(`${opponentName}'s ${opponentChoice} ${action} your ${picked}`)
        $("#results-text").text(`${opponentName} wins!`)
        $("#state-img").attr("src", `assets/images/${opponentChoice}-${picked}.png`);

    }   
    setTimeout(() => $("#modal2").modal("open"), 2000)
}