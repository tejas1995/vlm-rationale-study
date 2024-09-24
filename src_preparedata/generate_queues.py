#!/usr/bin/env python3

import json
import pandas as pd
from argparse import ArgumentParser
import random
import copy
import numpy as np

# ./src/baked_queues/generate_base.py --plan intervention_ci_long --uid-count 50 --reward-ratio 1x2
# ./src/baked_queues/generate_base.py --plan intervention_ci_long --uid-count 50 --reward-ratio 2x1

args = ArgumentParser()
args.add_argument("-d", "--data", default="data/ai2arc_hardquestions_50examples.tsv")
args.add_argument("-p", "--plan", default="control")
args.add_argument("-uc", "--uid-count", default=0, type=int)
args.add_argument("-s", "--seed", default=0, type=int)
args = args.parse_args()

random.seed(args.seed)

data = pd.read_csv(args.data, delimiter="\t")
data = data.to_dict(orient="records")

def decide_truthfulness_base(question):
    ai_is_correct = random.choices([True, False], weights=[0.7, 0.3], k=1)[0]
    if ai_is_correct:
        ai_confidence = 0.5*(1+np.random.beta(a=2, b=1))
    else:
        ai_confidence = 0.5*(1+np.random.beta(a=1, b=2))
    #ai_confidence = random.uniform(0.5, 0.9)
    #ai_is_correct = random.choices([True, False], weights=[ai_confidence, 1 - ai_confidence], k=1)[0]
    
    options = [question["correct_option"], question["incorrect_option"]]
    random.shuffle(options)
    correct_option = options.index(question["correct_option"])+1
    ai_prediction = correct_option if ai_is_correct else 3-correct_option

    return {
        "ai2arc_qid": question["ai2arc_qid"],
        "question": question["question"],
        "option1": options[0],
        "option2": options[1],
        "correct_option": correct_option,
        "ai_prediction": ai_prediction,
        "ai_confidence": f"{ai_confidence:.0%}",
        "ai_is_correct": ai_is_correct,
    }

def decide_truthfulness_calibrated(question):
    ai_confidence = random.uniform(0.5, 0.95)
    ai_is_correct = random.choices([True, False], weights=[ai_confidence, 1 - ai_confidence], k=1)[0]
    
    options = [question["correct_option"], question["incorrect_option"]]
    random.shuffle(options)
    correct_option = options.index(question["correct_option"])+1
    ai_prediction = correct_option if ai_is_correct else 3-correct_option

    return {
        "ai2arc_qid": question["ai2arc_qid"],
        "question": question["question"],
        "option1": options[0],
        "option2": options[1],
        "correct_option": correct_option,
        "ai_prediction": ai_prediction,
        "ai_confidence": f"{ai_confidence:.0%}",
        "ai_is_correct": ai_is_correct,
    }

def decide_truthfulness_calibrated_high_conf(question):
    #ai_confidence = random.uniform(0.7, 0.95)
    ai_confidence = 0.5*(1+np.random.beta(a=2, b=2))
    ai_is_correct = random.choices([True, False], weights=[ai_confidence, 1 - ai_confidence], k=1)[0]
    
    options = [question["correct_option"], question["incorrect_option"]]
    random.shuffle(options)
    correct_option = options.index(question["correct_option"])+1
    ai_prediction = correct_option if ai_is_correct else 3-correct_option

    return {
        "ai2arc_qid": question["ai2arc_qid"],
        "question": question["question"],
        "option1": options[0],
        "option2": options[1],
        "correct_option": correct_option,
        "ai_prediction": ai_prediction,
        "ai_confidence": f"{ai_confidence:.0%}",
        "ai_is_correct": ai_is_correct,
    }

def decide_truthfulness_confidently_incorrect(question):
    ai_is_correct = random.choices([True, False], weights=[0.1, 0.9], k=1)[0]
    ai_confidence = random.uniform(0.75, 0.9)

    return {
        "question": question["question"],
        "answer": question["answer1"] if ai_is_correct else question["answer2"],
        "ai_is_correct": ai_is_correct,
        "ai_confidence": f"{ai_confidence:.0%}",
    }

def decide_truthfulness_always_confident(question):
    ai_is_correct = random.choices([True, False], weights=[0.5, 0.5], k=1)[0]
    if ai_is_correct:
        ai_confidence = np.random.beta(a=8, b=2)
    else:
        ai_confidence = np.random.beta(a=5, b=2)
    
    return {
        "question": question["question"],
        "answer": question["answer1"] if ai_is_correct else question["answer2"],
        "ai_is_correct": ai_is_correct,
        "ai_confidence": f"{ai_confidence:.0%}",
    }

def decide_truthfulness_separable(question):
    ai_is_correct = random.choices([True, False], weights=[0.5, 0.5], k=1)[0]
    if ai_is_correct:
        ai_confidence = np.random.beta(a=15, b=2)
    else:
        ai_confidence = np.random.beta(a=6, b=5)
    return {
        "question": question["question"],
        "answer": question["answer1"] if ai_is_correct else question["answer2"],
        "ai_is_correct": ai_is_correct,
        "ai_confidence": f"{ai_confidence:.0%}",
    }


QUEUE_PLAN = {
    ## control
    "control": (
        30 * [decide_truthfulness_base] +
        []
    ),
    ## confidently incorrect
    #"intervention_ci_long": (
    #    10 * [decide_truthfulness_base] +
    #    5 * [decide_truthfulness_ci] +
    #    45 * [decide_truthfulness_base] +
    #    []
    #),
    #"intervention_ci_1_long": (
    #    10 * [decide_truthfulness_base] +
    #    1 * [decide_truthfulness_ci] +
    #    49 * [decide_truthfulness_base] +
    #    []
    #),
    #"intervention_ci_3_long": (
    #    10 * [decide_truthfulness_base] +
    #    3 * [decide_truthfulness_ci] +
    #    47 * [decide_truthfulness_base] +
    #    []
    #),
    #"intervention_ci_7_long": (
    #    10 * [decide_truthfulness_base] +
    #    7 * [decide_truthfulness_ci] +
    #    43 * [decide_truthfulness_base] +
    #    []
    #),
    #"intervention_ci_9_long": (
    #    10 * [decide_truthfulness_base] +
    #    9 * [decide_truthfulness_ci] +
    #    41 * [decide_truthfulness_base] +
    #    []
    #),
    ## unconfidently
    ## correct
    #"intervention_uc_long": (
    #    10 * [decide_truthfulness_base] +
    #    5 * [decide_truthfulness_uc] +
    #    45 * [decide_truthfulness_base] +
    #    []
    #),
    # calibrated
    "calibrated": (
        30 * [decide_truthfulness_calibrated] +
        []
    ),
    "calibrated_high_conf": (
        30 * [decide_truthfulness_calibrated_high_conf] + []
    ),
    #"always_confident": (
    #    60 * [decide_truthfulness_always_confident] +
    #    []
    #),
    #"separable": (
    #    60 * [decide_truthfulness_separable] +
    #    []
    #),
    #"calibrated_with_ci": (
    #    10 * [decide_truthfulness_calibrated] +
    #    5 * [decide_truthfulness_confidently_incorrect] +
    #    45 * [decide_truthfulness_calibrated] +
    #    []
    #),
}

UIDs = [
    "demo",
]

for uid in list(range(args.uid_count)):
    queue = copy.deepcopy(data)
    random.shuffle(queue)
    queue = [
        decide_fn(question)
        for question, decide_fn
        in zip(queue, QUEUE_PLAN[args.plan])
    ]
    #print(f"Queue {uid}: Accuracy = {np.mean([q['ai_is_correct'] for q in queue])}")
    if type(uid) == int:
        uid = f"{uid:0>3}"

    with open(f"web/baked_queues/{args.plan}_{uid}.json", "w") as f:
        json.dump(queue, f, indent=4, ensure_ascii=False)
