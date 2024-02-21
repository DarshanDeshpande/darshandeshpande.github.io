---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* M.S. in Computer Science, University of Southern California, 2024
* B.S. in Computer Engineering, Mumbai University, 2022

Work experience
======
* August 2022 - May 2024: Research Assistant
  * Information Sciences Institute
  * Duties include: Conducting novel research on argumentation, and logical and commonsense reasoning in dialogue systems and LLMs.
  * Advisors: [Filip Ilievski](https://www.ilievski.info/), [Fred Morstatter](https://www.isi.edu/~fredmors/), [Jonathan May](https://jonmay.github.io/webpage/)
  
Skills
======
* Languages: Advanced Python, CUDA, C, Java, SQL, JavaScript, HTML/CSS
* Machine Learning: Pytorch, Tensorflow, Keras, JAX, Hugging Face, Sklearn, XgBoost, Pandas, NumPy, Matplotlib
* Deployment: Docker, Flask, Django, RestAPI, FastAPI
* Developer Tools: Git, Docker, Google Cloud Platform, Amazon AWS, Microsoft Azure
* Database Management: MongoDB, MySQL, PostgreSQL, SQLite

Publications
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Talks
======
  <ul>{% for post in site.talks reversed %}
    {% include archive-single-talk-cv.html  %}
  {% endfor %}</ul>

Projects and Reports
=====
* [Exploring Diffusion Models with JAX]() - Python, JAX, TPU (June 2022) 
  * Explores the mathematics and code of discrete diffusion models, their effectiveness, applicability, and limitations.
* [Review Classification using Active Learning]() - Tensorflow, Keras, GPU (Oct. 2021) 
  * Demonstrates the effectiveness of active learning in text classification tasks by implementing a ratio-based sampling
    approach, improving performance and suitability for industrial applications.
* [The Reality Behind the Optimization of Imaginary Variables - I and II]() - Research (Jun 2021 – Oct 2021)
  * Leverages complex-valued neural networks to enhance representations by experimenting with traditional mappings and more efficient complex vector techniques.
  * Explores circularity and holomorphicity constraints in complex-valued neural networks, showcasing the effectiveness of linear and widely linear networks for image-denoising.
* [MelGAN based Spectrogram Inversion using Feature Matching]() - Reproducibility (Sep. 2021)
  * Showcases a non-autoregressive model for spectral inversion utilizing a feature-matching discriminator, highlighting fast inference on dynamic inputs.

Awards and Grants
=====
* <b>Google OSS Expert Award (2022)</b>: For releasing open-source articles with code for exploring diffusion models. 
* <b>Papers With Code Top Contributor Award (2022)</b>: For open-source and reproducibility contributions with JAX. 
* <b>Google Research Grant (2021)</b>: A $5,000 grant to investigate the robustness of ML-based steganography methods.