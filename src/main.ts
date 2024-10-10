import { DEVMODE } from "./globals"
export var UID: string
export var MOCKMODE: boolean = false
import { load_data, log_data } from './connector'
import { paramsToObject } from "./utils"

var data: any[] = []
let question_i = -1
let question: any = null
let final_user_decision: boolean
let accessed_explanation: boolean = false
let accessed_sources: boolean = false
let accessed_individual_source: any[] = [false, false, false, false, false, false, false, false, false, false]
let balance = 0
let time_question_start: number
let time_to_access_explanation: number = -1
let time_to_access_sources: number = -1
let time_to_access_individual_source: any[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
let time_final_decision: number = -1
let instruction_i: number = 0
let count_exited_page: number = 0

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

// Function to toggle the visibility of the div element
function showExplanation() {
    if (time_final_decision != -1) {
        return
    }

    // Get the div element by its ID
    const div = document.getElementById('ai_explanation_dropdown');
    if (div) {
        // Toggle the visibility
        div.style.display = 'block';
    }
    const button_div = document.getElementById('ai_explanation_dropbtn');
    if (button_div) {
        //Change the class to arrow down
        button_div.className = 'arrow vanish';
    }
    accessed_explanation = true
    time_to_access_explanation = Date.now() - time_question_start

    //$("#ai_explanation_dropdown").toggle()
    $("#ai_explanation_titlebar").attr("disabled", "true")
    $("#ai_explanation_titlebar").attr("activedecision", "true")
  }
  
// Event listener for the button click
document.getElementById('ai_explanation_titlebar')?.addEventListener('click', showExplanation);

function showAllSources() {
    if (time_final_decision != -1) {
        return
    }

    // Get the div element by its ID
    const div = document.getElementById('all_sources_div');
    if (div) {
        // Toggle the visibility
        div.style.display = 'block';
    }
    const button_div = document.getElementById('view_sources_dropbtn');
    if (button_div) {
        //Change the class to arrow vanish
        button_div.className = 'arrow vanish';
    }
    accessed_sources = true
    time_to_access_sources = Date.now() - time_question_start

    //$("#ai_explanation_dropdown").toggle()
    $("#view_sources_titlebar").attr("disabled", "true")
    $("#view_sources_titlebar").attr("activedecision", "true")
}

// Event listener for the button click
document.getElementById('view_sources_titlebar')?.addEventListener('click', showAllSources);

function showSource(source_num: number) {
    if (time_final_decision != -1) {
        return
    }
    
    // Get the div element by its ID
    const div = document.getElementById(`source_${source_num}_span`);
    if (div) {
        // Toggle the visibility
        div.style.display = 'block';
    }
    const button_div = document.getElementById(`source_${source_num}_dropbtn`);
    if (button_div) {
        //Change the class to arrow down
        button_div.className = 'arrow down';
    }
    accessed_individual_source[source_num] = true
    time_to_access_individual_source[source_num] = Date.now() - time_question_start
    //$("#ai_explanation_dropdown").toggle()
    $(`#source_${source_num}_titlebar`).attr("disabled", "true")
    $(`#source_${source_num}_titlebar`).attr("activedecision", "true")
}

// Event listener for the button click
document.getElementById('source_0_titlebar')?.addEventListener('click', () => showSource(0));
document.getElementById('source_1_titlebar')?.addEventListener('click', () => showSource(1));
document.getElementById('source_2_titlebar')?.addEventListener('click', () => showSource(2));
document.getElementById('source_3_titlebar')?.addEventListener('click', () => showSource(3));
document.getElementById('source_4_titlebar')?.addEventListener('click', () => showSource(4));
document.getElementById('source_5_titlebar')?.addEventListener('click', () => showSource(5));
document.getElementById('source_6_titlebar')?.addEventListener('click', () => showSource(6));
document.getElementById('source_7_titlebar')?.addEventListener('click', () => showSource(7));
document.getElementById('source_8_titlebar')?.addEventListener('click', () => showSource(8));
document.getElementById('source_9_titlebar')?.addEventListener('click', () => showSource(9));

function updateUserDecision(user_decision: boolean) {
    if (question_i != -1) {
        final_user_decision = user_decision ? true : false

        time_final_decision = Date.now() - time_question_start

        $("#ai_explanation_titlebar").attr("disabled", "true")
        $("#view_sources_titlebar").attr("disabled", "true")
        for (let source_num = 0; source_num < 10; source_num++) {
            $(`#source_${source_num}_titlebar`).attr("disabled", "true")
        }

        $("#button_next").show()
        $("#button_next").removeAttr("disabled")
        if (question_i >= 0) {
            $('#button_quit').show()
            $('#button_quit').removeAttr("disabled")
        }
        //$("#button_user_decision_claimtrue").attr("disabled", "true")
        //$("#button_user_decision_claimfalse").attr("disabled", "true")
        if (user_decision) {
            final_user_decision = true
            $("#button_user_decision_claimtrue").attr("activedecision", "true")
            $("#button_user_decision_claimfalse").attr("activedecision", "false")
        }
        else {
            final_user_decision = false
            $("#button_user_decision_claimfalse").attr("activedecision", "true")
            $("#button_user_decision_claimtrue").attr("activedecision", "false")
        }

    }
}

$("#button_user_decision_claimtrue").on("click", () => updateUserDecision(true))
$("#button_user_decision_claimfalse").on("click", () => updateUserDecision(false))


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

    let gt_label: boolean = question!["gt_label"]
    let user_is_correct: boolean = gt_label == final_user_decision
    if (user_is_correct) {
        balance += 0.1
    }

    if (question_i != -1) {
        let logged_data = {
            "question_i": question_i,
            "user_balance_post_interaction": balance,
            "final_user_decision": final_user_decision,
            "user_is_correct": user_is_correct,
            "accessed_explanation": accessed_explanation,
            "accessed_sources": accessed_sources,
            "accessed_individual_source": accessed_individual_source,
        }

        logged_data['times'] = {
            "access_explanation": time_to_access_explanation,
            "access_sources": time_to_access_sources,
            "access_individual_source": time_to_access_individual_source,
            "final_decision": time_final_decision,
        }
        logged_data['question'] = question
        logged_data['count_exited_page'] = count_exited_page
        log_data(logged_data)
        count_exited_page = 0
    }
    

    next_question()
});

$("#button_quit").on("click", () => {
    let gt_label: boolean = question!["gt_label"]
    let user_is_correct: boolean = gt_label == final_user_decision
    if (user_is_correct) {
        balance += 0.1
    }

    if (question_i != -1) {
        let logged_data = {
            "question_i": question_i,
            "user_balance_post_interaction": balance,
            "final_user_decision": final_user_decision,
            "accessed_explanation": accessed_explanation,
            "accessed_sources": accessed_sources,
            "accessed_individual_source": accessed_individual_source,
        }

        logged_data['times'] = {
            "access_explanation": time_to_access_explanation,
            "access_sources": time_to_access_sources,
            "access_individual_source": time_to_access_individual_source,
            "final_decision": time_final_decision,
        }
        logged_data['question'] = question
        logged_data['count_exited_page'] = count_exited_page
        log_data(logged_data)
        count_exited_page = 0
    }

    $("#main_box_experiment").hide()
    if (MOCKMODE) {
        $('#reward_box_mock').text(`Your total reward is $${balance.toFixed(2)} (${question_i+1} questions answered).`)
        $('#reward_box_mock').show()
        $("#main_box_end_mock").show()
    } else {
        $('#reward_box').text(`Your total reward is $${balance.toFixed(2)} (${question_i+1} questions answered).`)
        $('#reward_box').show()
        $("#main_box_end").show()
    }
    return
})



function show_result() {


    //let ai_is_correct: boolean = question!["llm_is_correct"]
    //let message = "Correct answer: <b>Option " + correct_option + "</b>.<br>"
    //if (user_is_correct) {
    //    message += "You picked Option " + final_user_decision + ", which was <span class='color_correct'><b>correct</b></span>.<br>"
    //}
    //else {
    //    message += "You picked Option " + final_user_decision + ", which was <span class='color_incorrect'><b>incorrect</b></span>.<br>"
    //}
    //if (ai_is_correct) {
    //    message += "The AI picked Option " + question!["ai_prediction"] + ", which was <span class='color_correct'><b>correct<b></span>.<br>"
    //}
    //else {
    //    message += "The AI picked Option " + question!["ai_prediction"] + ", which was <span class='color_incorrect'><b>incorrect</b></span>.<br>"
    //}
    //if (user_is_correct) {
    //    message += "<span class='color_correct'><b>You receive a reward of $0.10.</b></span>"
    //    balance += 0.1
    //}
    //else {
    //    message += "<span class='color_incorrect'><b>You do not receive any reward.</b></span>"
    //}
    //message += "<br>"
    //if (success) {
    //    message += `You gain $${(bet_val*bet_val_ratio).toFixed(2)}.`
    //    balance += bet_val*bet_val_ratio
    //} else {
    //    message += `You lose $${(bet_val/1.0).toFixed(2)}.`
    //    balance -= bet_val/1.0
    //    balance = Math.max(0, balance)
    //}
    //$("#balance").text(`Balance: $${balance.toFixed(2)} + $1.0`)
    //$("#result_span").html(message)
    ////$("#button_next").show()
    //$("#result_span").show()
    //$("#button_place_bet").hide()

    //$('#range_val').attr("disabled", "true")
}

//$("#button_place_bet").on("click", show_result)

function next_question() {
    // restore previous state of UI

    $("#button_user_decision_claimtrue").removeAttr("activedecision")
    $("#button_user_decision_claimfalse").removeAttr("activedecision")
    $("#button_user_decision_claimtrue").removeAttr("disabled")
    $("#button_user_decision_claimfalse").removeAttr("disabled")

    $("#ai_explanation_dropbtn").removeAttr("disabled")
    $("#ai_explanation_dropbtn").removeAttr("activedecision")
    $("#ai_explanation_dropbtn").attr("class", "arrow right")
    $("#ai_explanation_titlebar").removeAttr("disabled")
    $("#ai_explanation_titlebar").removeAttr("activedecision")
    $("#ai_explanation_dropdown").hide()

    $("#view_sources_dropbtn").removeAttr("disabled")
    $("#view_sources_dropbtn").removeAttr("activedecision")
    $("#view_sources_dropbtn").attr("class", "arrow right")
    $("#view_sources_titlebar").removeAttr("disabled")
    $("#view_sources_titlebar").removeAttr("activedecision")
    $("#all_sources_div").hide()

    for (let i = 0; i < 10; i++) {
        $(`#source_${i}_span`).hide()
        $(`#source_${i}_dropbtn`).removeAttr("disabled")
        $(`#source_${i}_dropbtn`).removeAttr("activedecision")
        $(`#source_${i}_dropbtn`).attr("class", "arrow right")
        $(`#source_${i}_titlebar`).removeAttr("disabled")
        $(`#source_${i}_titlebar`).removeAttr("activedecision")
    }

    accessed_explanation = false
    accessed_sources = false
    accessed_individual_source = [false, false, false, false, false, false, false, false, false, false]

    time_to_access_explanation = -1
    time_to_access_sources = -1
    time_to_access_individual_source = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
    time_final_decision = -1
    

    $("#button_next").hide()
    $('#button_quit').hide()
    //$("#range_val").val(user_trust)

    question_i += 1
    if (question_i >= data.length) {
        $("#main_box_experiment").hide()
        if (MOCKMODE) {
            $('#reward_box_mock').text(`Your total reward is $${balance.toFixed(2)} (${question_i+1} questions answered).`)
            $('#reward_box_mock').show()
            $("#main_box_end_mock").show()
        } else {
            $('#reward_box').text(`Your total reward is $${balance.toFixed(2)} (${question_i+1} questions answered).`)
            $('#reward_box').show()
            $("#main_box_end").show()
        }
        return
    }
    question = data[question_i]

    $("#claim_span").html(question!["claim"])
    let ai_prediction = question!["llm_prediction"] ? "The claim is true." : "The claim is false."
    $("#ai_prediction_span").html(ai_prediction)
    $("#ai_confidence_span").html(question!["llm_confidence"])

    $("#ai_explanation_span").html(question!["llm_explanation"])
    for (let i = 0; i < question!["sources"].length; i++) {
        $(`#source_${i}_span`).html(question!["sources"][i])
    }

    // set bet value ratio
    //if(question.hasOwnProperty("reward_ratio")) {
    //    let [ratio1, ratio2] = question["reward_ratio"]
    //    ratio1 = Number(ratio1)
    //    ratio2 = Number(ratio2)
    //    bet_val_ratio = ratio1/ratio2
    //} else {
    //    bet_val_ratio = 1
    //}

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
if (DEVMODE) {
    MOCKMODE = true
} else if (globalThis.url_data['session_id'].startsWith("demo")) {
    MOCKMODE = true
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
        //if (!(globalThis.uid!.startsWith("demo"))) {
        //    alert("Please don't leave the page. If you do so again, we may restrict paying you.")
        //}
        alert_active = false
    }
}