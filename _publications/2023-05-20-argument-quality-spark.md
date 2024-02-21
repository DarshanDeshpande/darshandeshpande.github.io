---
title: "Contextualizing Argument Quality Assessment with Relevant Knowledge"
collection: publications
permalink: /publication/2023-05-20-argument-quality-spark
excerpt: 'This work proposes SPARK: a novel method for scoring argument quality based on contextualization via relevant knowledge, and devise four augmentations that leverage large language models to provide feedback, infer hidden assumptions, supply a similar-quality argument, or a counterargument.'
date: 2024-05-20
venue: 'NAACL-2024'
paperurl: 'https://arxiv.org/abs/2305.12280'
citation: 'Deshpande, D., Sourati, Z., Ilievski, F., & Morstatter, F. (2023). Contextualizing Argument Quality Assessment with Relevant Knowledge. ArXiv, abs/2305.12280.'
---

Automatic assessment of the quality of arguments has been recognized as a challenging task with significant implications for misinformation and targeted speech. While real world arguments are tightly anchored in context, existing efforts to judge argument quality analyze arguments in isolation, ultimately failing to accurately assess arguments. We propose SPARK: a novel method for scoring argument quality based on contextualization via relevant knowledge. We devise four augmentations that leverage large language models to provide feedback, infer hidden assumptions, supply a similar-quality argument, or a counterargument. We use a dual-encoder Transformer architecture to enable the original argument and its augmentation to be considered jointly. Our experiments in both in-domain and zero-shot setups show that SPARK consistently outperforms baselines across multiple metrics. We make our code available to encourage further work on argument assessment.