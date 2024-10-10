import json
import pandas as pd
from argparse import ArgumentParser
import random
import copy
import numpy as np

# ./src/baked_queues/generate_base.py --plan intervention_ci_long --uid-count 50 --reward-ratio 1x2
# ./src/baked_queues/generate_base.py --plan intervention_ci_long --uid-count 50 --reward-ratio 2x1

args = ArgumentParser()
args.add_argument("-d", "--data", default="/home/tejas/projects/llm-trust/data/fm2_claims/llama3.1_8b_outputs/manually_filtered_50_instances.json")
args.add_argument("-n", "--name", default="fm2_llama3.1_8b")
args.add_argument("--num_instances", type=int, default=50)
args.add_argument("-uc", "--uid-count", default=0, type=int)
args.add_argument("-s", "--seed", default=0, type=int)
args = args.parse_args()

random.seed(args.seed)

data = json.load(open(args.data))

prepared_data = []
for d in data:
    fm2_index = d["fm2_index"]
    claim = d["claim"]
    gt_label = True if d["label"] == "SUPPORTS" else False
    llm_prediction = True if d["llm_prediction"] == "SUPPORTS" else False
    llm_is_correct = gt_label == llm_prediction
    llm_confidence = f"{d['llm_conf:self_consistency']:.0%}"
    llm_explanation = d["llm_explanation"]
    sources = [s['text'] for s in d["retrieved_passages"]]
    random.shuffle(sources)
    #print(len(sources))
    prepared_data.append({
        "fm2_index": fm2_index,
        "claim": claim,
        "gt_label": gt_label,
        "llm_prediction": llm_prediction,
        "llm_is_correct": llm_is_correct,
        "llm_confidence": llm_confidence,
        "llm_explanation": llm_explanation,
        "sources": sources
    })

for uid in list(range(args.uid_count)):
    sampled_data = random.sample(prepared_data, args.num_instances)
    random.shuffle(sampled_data)
    out_file = f"web/baked_queues/{args.name}_{args.num_instances}instances_seed{args.seed}_{uid:0>3}.json"
    print(out_file)
    json.dump(sampled_data, open(out_file, "w"), indent=2)