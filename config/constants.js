module.exports = {
    alpha: 0.8, // the decay rate of the contribution
    // the recommendation strategy option: 
    // Equal Voting : conservative/aggressive/considerate
    // Capacity Value : contribution/subgraph
    strategy: "contribution", 
    unsure_gap: 1, // the max gap that the hint is sure
    hint_weight: 0.8, // the weight of the hinted link
    };
  