module.exports = {
    alpha: 0.8, // the decay rate of the contribution
    // the recommendation strategy option: 
    // Equal Voting : conservative/aggressive/considerate
    // Capacity Value : contribution/subgraph
    strategy: "contribution",
    unsure_gap: 1, // the max gap that the hint is sure
    hint_weight: 0.8, // the weight of the hinted link(in Equal Voting)

    decay: 0.618, // the weight discount of the hinted link
    epsilon: 0.2, // the gap beteen weight-positive
    phi: 0, // the minimal confidence value to be hinted
    msn: 1, // minimal supporter num to be hinted
    create_correct_link_score: 3,
    remove_correct_link_score: -6,
    create_wrong_link_score: -3,
    remove_wrong_link_score: 3,
    remove_hinted_wrong_link_score: 6,
};
