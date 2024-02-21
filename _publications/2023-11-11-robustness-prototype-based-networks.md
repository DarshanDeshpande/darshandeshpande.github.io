---
title: "Robust Text Classification: Analyzing Prototype-Based Networks"
collection: publications
permalink: /publication/2023-11-11-robustness-prototype-based-networks
excerpt: 'A modular and comprehensive framework for studying Prototype Based Networks (PBNs), which includes different backbone architectures, backbone sizes, and objective functions is designed, which shows that the robustness of PBNs transfers to NLP classification tasks facing realistic perturbations.'
date: 2023-11-11
venue: 'arXiv'
paperurl: 'https://arxiv.org/abs/2311.06647'
citation: 'Sourati, Z., Deshpande, D., Ilievski, F., Gashteovski, K., & Saralajew, S. (2023). Robust Text Classification: Analyzing Prototype-Based Networks. ArXiv, abs/2311.06647.'
---

Downstream applications often require text classification models to be accurate, robust, and interpretable. While the accuracy of the stateof-the-art language models approximates human performance, they are not designed to be interpretable and often exhibit a drop in performance on noisy data. The family of PrototypeBased Networks (PBNs) that classify examples based on their similarity to prototypical examples of a class (prototypes) is natively interpretable and shown to be robust to noise, which enabled its wide usage for computer vision tasks. In this paper, we study whether the robustness properties of PBNs transfer to text classification tasks. We design a modular and comprehensive framework for studying PBNs, which includes different backbone architectures, backbone sizes, and objective functions. Our evaluation protocol assesses the robustness of models against character-, word-, and sentence-level perturbations. Our experiments on three benchmarks show that the robustness of PBNs transfers to NLP classification tasks facing realistic perturbations. Moreover, the robustness of PBNs is supported mostly by the objective function that keeps prototypes interpretable, while the robustness superiority of PBNs over vanilla models becomes more salient as datasets get more complex.