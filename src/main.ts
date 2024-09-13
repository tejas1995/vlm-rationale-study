import { DEVMODE } from "./globals"
export var UID: string
export var MOCKMODE: boolean = false
import { load_data, log_data } from './connector'
import { paramsToObject } from "./utils"

var data: any[] = []
let question_i = -1
let question: any = null
let initial_user_decision: number = -1
let final_user_decision: number = -1
let balance = 0
let user_trust: number
let bet_val_ratio: number = 1
let time_question_start: number
let time_final_decision_start: number
let time_trust_decision_start: number
let instruction_i: number = 0
let count_exited_page: number = 0

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function next_instructions(increment: number) {
    instruction_i += increment

    if (instruction_i == 0) {
        $("#button_instructions_prev").attr("disabled", "true")
    } else {
        $("#button_instructions_prev").removeAttr("disabled")
    }
    if (instruction_i >= 6) {
        $("#instructions_and_decorations").show()
        $("#button_instructions_next").val("Start study")
    } else {
        $("#instructions_and_decorations").hide()
        $("#button_instructions_next").val("Next")
    }
    if (instruction_i == 7) {
        $("#main_box_instructions").hide()
        $("#main_box_experiment").show()
        next_question()
    }

    $("#main_box_instructions").children(":not(input)").each((_, el) => {
        $(el).hide()
    })
    $(`#instructions_${instruction_i}`).show()
}
$("#button_instructions_next").on("click", () => next_instructions(+1))
$("#button_instructions_prev").on("click", () => next_instructions(-1))

$("#button_next").on("click", () => {
    if (question_i != -1) {
        let logged_data = {
            "question_i": question_i,
            "user_balance_post_interaction": balance,
            "user_trust_val": user_trust,
            "initial_user_decision": initial_user_decision,
            "final_user_decision": final_user_decision,
        }

        logged_data['times'] = {
            "initial_decision": time_final_decision_start - time_question_start,
            "final_decision": time_trust_decision_start - time_final_decision_start,
            "user_trust": Date.now() - time_trust_decision_start,
        }
        logged_data['question'] = question
        logged_data['count_exited_page'] = count_exited_page
        log_data(logged_data)
        count_exited_page = 0
    }
    next_question()
});

//$('#range_val').on('input change', function () {
//    bet_val = ($(this).val()! as number) / 5 * 0.1
//    $("#range_text").text(`If you are right, you get $${(bet_val*bet_val_ratio).toFixed(2)}. If you are wrong, you lose $${(bet_val/1.0).toFixed(2)}.`)
//    $("#button_place_bet").show()
//});

$('#range_val').on('input change', function () {
    user_trust = ($(this).val()! as number)
    $("#range_text").text(`After this interaction, your current trust in the AI: ${user_trust * 10} / 100.`)
    $("#button_next").show()
});

function make_initial_user_decision(option) {
    time_final_decision_start = Date.now()
    initial_user_decision = option
    assert(option == 1 || option == 2, "Invalid option!")
    if (option == 1) {
        $("#button_initial_decision_option1").attr("activedecision", "true")
        $("#button_initial_decision_option2").removeAttr("activedecision")
    } else {
        $("#button_initial_decision_option1").removeAttr("activedecision")
        $("#button_initial_decision_option2").attr("activedecision", "true")
    }
    $("#ai_assistance_div").show()
    $("#final_user_decision_div").show()
    $("#button_initial_decision_option1").attr("disabled", "true")
    $("#button_initial_decision_option2").attr("disabled", "true")
    $("#button_final_decision_option1").removeAttr("disabled")
    $("#button_final_decision_option2").removeAttr("disabled")

}

$("#button_initial_decision_option1").on("click", () => make_initial_user_decision(1))
$("#button_initial_decision_option2").on("click", () => make_initial_user_decision(2))

function make_final_user_decision(option) {
    time_trust_decision_start = Date.now()
    final_user_decision = option
    assert(option == 1 || option == 2, "Invalid option!")
    if (option == 1) {
        $("#button_final_decision_option1").attr("activedecision", "true")
        $("#button_final_decision_option2").removeAttr("activedecision")
    } else {
        $("#button_final_decision_option1").removeAttr("activedecision")
        $("#button_final_decision_option2").attr("activedecision", "true")
    }
    $("#button_final_decision_option1").attr("disabled", "true")
    $("#button_final_decision_option2").attr("disabled", "true")
    show_result()
}

$("#button_final_decision_option1").on("click", () => make_final_user_decision(1))
$("#button_final_decision_option2").on("click", () => make_final_user_decision(2))

function show_result() {

    let correct_option: number = question!["correct_option"]
    let user_is_correct: boolean = correct_option == final_user_decision

    let ai_is_correct: boolean = question!["ai_is_correct"]
    let message = "Correct answer: <b>Option " + correct_option + "</b>.<br>"
    if (user_is_correct) {
        message += "You picked Option " + final_user_decision + ", which was <span class='color_correct'><b>correct</b></span>.<br>"
    }
    else {
        message += "You picked Option " + final_user_decision + ", which was <span class='color_incorrect'><b>incorrect</b></span>.<br>"
    }
    if (ai_is_correct) {
        message += "The AI picked Option " + question!["ai_prediction"] + ", which was <span class='color_correct'><b>correct<b></span>.<br>"
    }
    else {
        message += "The AI picked Option " + question!["ai_prediction"] + ", which was <span class='color_incorrect'><b>incorrect</b></span>.<br>"
    }
    if (user_is_correct) {
        message += "<span class='color_correct'><b>You receive a reward of $0.10.</b></span>"
        balance += 0.1
    }
    else {
        message += "<span class='color_incorrect'><b>You do not receive any reward.</b></span>"
    }

    message += "<br>"
    //if (success) {
    //    message += `You gain $${(bet_val*bet_val_ratio).toFixed(2)}.`
    //    balance += bet_val*bet_val_ratio
    //} else {
    //    message += `You lose $${(bet_val/1.0).toFixed(2)}.`
    //    balance -= bet_val/1.0
    //    balance = Math.max(0, balance)
    //}
    $("#balance").text(`Balance: $${balance.toFixed(2)} + $1.0`)
    $("#result_span").html(message)
    //$("#button_next").show()
    $("#result_span").show()
    //$("#button_place_bet").hide()
    $("#how_confident_div").show()

    //$('#range_val').attr("disabled", "true")
}

//$("#button_place_bet").on("click", show_result)

function next_question() {
    // restore previous state of UI
    $("#button_initial_decision_option1").removeAttr("activedecision")
    $("#button_initial_decision_option2").removeAttr("activedecision")
    $("#button_initial_decision_option1").removeAttr("disabled")
    $("#button_initial_decision_option2").removeAttr("disabled")
    $("#button_final_decision_option1").removeAttr("activedecision")
    $("#button_final_decision_option2").removeAttr("activedecision")
    $("#button_final_decision_option1").removeAttr("disabled")
    $("#button_final_decision_option2").removeAttr("disabled")
    $("#ai_assistance_div").hide()
    $("#final_user_decision_div").hide()
    $('#range_val').removeAttr("disabled")
    $("#how_confident_div").hide()
    $("#button_place_bet").hide()
    $("#button_next").hide()
    $("#result_span").hide()
    if (question_i == -1) {
        $("#range_text").text("-")
    }
    else {
        $("#range_text").text(`Before this interaction, your trust in the AI: ${user_trust * 10} / 100.`)
    }
    $("#range_val").val(user_trust)

    question_i += 1
    if (question_i >= data.length) {
        $("#main_box_experiment").hide()
        if (MOCKMODE) {
            $("#main_box_end_mock").show()
        } else {
            $("#main_box_end").show()
        }
        return
    }
    question = data[question_i]

    $("#question_span").html(question!["question"])
    $("#option1_span").html(question!["option1"])
    $("#option2_span").html(question!["option2"])
    $("#ai_prediction_span").html("Option " + question!["ai_prediction"])
    $("#ai_confidence_span").html(question!["ai_confidence"])

    // set bet value ratio
    if(question.hasOwnProperty("reward_ratio")) {
        let [ratio1, ratio2] = question["reward_ratio"]
        ratio1 = Number(ratio1)
        ratio2 = Number(ratio2)
        bet_val_ratio = ratio1/ratio2
    } else {
        bet_val_ratio = 1
    }

    time_question_start = Date.now()
    $("#progress").text(`Progress: ${question_i + 1} / ${data.length}`)
}

// get user id and load queue
// try to see if start override was passed
const urlParams = new URLSearchParams(window.location.search);
const startOverride = urlParams.get('start');
const UIDFromURL = urlParams.get("uid")
globalThis.url_data = paramsToObject(urlParams.entries())

if (UIDFromURL != null) {
    globalThis.uid = UIDFromURL as string
    if (globalThis.uid == "prolific_random") {
        let queue_id = `${Math.floor(Math.random() * 10)}`.padStart(3, "0")
        globalThis.uid = `${urlParams.get("prolific_queue_name")}_${queue_id}`
    }
} else if (DEVMODE) {
    globalThis.uid = "demo"
} else {
    let UID_maybe: any = null
    while (UID_maybe == null) {
        UID_maybe = prompt("Enter your user id. Please get in touch if you were not assigned an id but wish to participate in this experiment.")
    }
    globalThis.uid = UID_maybe!
}

// version for paper
if (globalThis.uid.startsWith("demo_paper")) {
    MOCKMODE = true
} else {

}
console.log("Running with UID", globalThis.uid)
load_data().catch((_error) => {
    //alert("Invalid user id.")
    console.log("Invalid user id.")
    console.log(globalThis.uid!)
    window.location.reload()
}
).then((new_data) => {
    data = new_data
    if (startOverride != null) {
        question_i = parseInt(startOverride) - 1
        console.log("Starting from", question_i)
    }
    // next_question()
    next_instructions(0)
    $("#main_box_instructions").show()
    $("#instructions_and_decorations").hide()
})

console.log("Starting session with UID:", globalThis.uid!)

let alert_active = false
document.onvisibilitychange = () => {
    if (!alert_active) {
        count_exited_page += 1
        alert_active = true
        alert("Please don't leave the page. If you do so again, we may restrict paying you.")
        alert_active = false
    }
}