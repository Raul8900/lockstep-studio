# Sources — “The 'I'm not a robot' box”

Research came before the script. Every number and every strong claim in the narration or on screen
traces to an entry here.

**How these were checked.** The full pages could not be opened in this session: a page fetch was
refused by the session's permission check, so this file was built from search-engine excerpts of each
page and paper (their abstracts, summaries and tables). Each row says which. Wording marked
"paraphrase" is the search summary's wording, not the page's own sentence. Before the video is
published, the Google pages (rows 1–4) and the three arXiv papers (rows 5–8) should be read in full and
any differing wording corrected here.

---

## 1. Primary sources

| # | Source | How checked | What it supports |
|---|---|---|---|
| 1 | Google Security Blog, *reCAPTCHA just got easier (but only if you're human)*, October 2013. https://security.googleblog.com/2013/10/recaptcha-just-got-easier-but-only-if.html | excerpt (paraphrase) | Google's risk analysis covers everything a visitor does around the challenge, not only the typed answer. |
| 2 | Google Security Blog, *Are you a robot? Introducing "No CAPTCHA reCAPTCHA"*, 3 December 2014. https://security.googleblog.com/2014/12/are-you-robot-introducing-no-captcha.html (same post: https://developers.google.com/search/blog/2014/12/are-you-robot-introducing-no-captcha) | excerpt (paraphrase) | The checkbox replaced distorted-text puzzles so that many users could pass with one click. The backend weighs what a visitor does and falls back to a puzzle when it cannot tell whether they are human. |
| 3 | Google for Developers, *reCAPTCHA v3 documentation*. https://developers.google.com/recaptcha/docs/v3 | excerpt (quoted phrasing confirmed) | v3 returns a score: 1.0 is "very likely a good interaction", 0.0 is "very likely a bot". v3 never shows a puzzle, so it has no checkbox. Each site sets its own threshold for each action. Google's guidance names 0.5 as a starting cutoff. |
| 4 | Google for Developers, *reCAPTCHA FAQ*. https://developers.google.com/recaptcha/docs/faq | excerpt (paraphrase) | The `_GRECAPTCHA` cookie is essential and exists to support the risk analysis. Sites can load reCAPTCHA from recaptcha.net to avoid extra google.com cookies. |
| 5 | Ismail Akrout, Amal Feriani & Mohamed Akrout, *Hacking Google reCAPTCHA v3 using Reinforcement Learning*, arXiv:1903.01003 (2019; accepted to RLDM 2019). https://arxiv.org/abs/1903.01003 | excerpt (abstract and summary) | A reinforcement-learning agent learned to move a cursor and click the v3 button in a simulated environment the authors built. A run counted as a success at score 0.9. Success was 97.4% on a 100×100 grid and 96.7% on a 1000×1000 screen. These are simulator results, not results on the live site. |
| 6 | Andreas Plesner, Tobias Vontobel & Roger Wattenhofer, *Breaking reCAPTCHAv2*, arXiv:2409.08831 (2024; COMPSAC 2024). https://arxiv.org/abs/2409.08831 | excerpt (abstract and tables) | The authors report that cookies and browsing history carry substantial weight in deciding whether a visitor seems human. In their tests, any cursor movement reduced the number of challenges needed to pass compared with no movement. Straight-line and Bézier paths did not differ significantly (t = 0.58, p = 0.57). |
| 7 | Andrew Searles, Renascence Tarafder Prapty & Gene Tsudik, *Dazed & Confused: A Large-Scale Real-World User Study of reCAPTCHAv2*, arXiv:2311.10911 (November 2023). https://arxiv.org/abs/2311.10911 | excerpt (abstract) | A 13-month live study with more than 3,600 participants at a large public university. The authors judge the cost very high and the security benefit close to nil, and call for reCAPTCHAv2 to be retired. |
| 8 | *Gotta CAPTCHA 'Em All: A Survey of Twenty Years of the Human-or-Computer Dilemma*, arXiv:2103.01748 (2021). https://arxiv.org/pdf/2103.01748 | excerpt (survey's description; secondhand) | The v2 checkbox gathers cursor movement, click location and hover time, along with plugin, language and cookie details, and passes them to a bot-risk engine. An image challenge follows if the assessment does not clear the user. |
| 9 | Alejandro Acien, Aythami Morales, Julian Fierrez & Ruben Vera-Rodriguez, *BeCAPTCHA-Mouse: Synthetic Mouse Trajectories and Improved Bot Detection*, arXiv:2005.00890 (2020; later in *Pattern Recognition*, vol. 127, 2022, as cited by later papers). https://arxiv.org/abs/2005.00890 | excerpt (abstract) | A detector built on neuromotor-model features of mouse paths, trained on real and synthetic trajectories. Its data come from drag-and-drop steps in an image puzzle, not from a checkbox click. |
| 10 | T. Flash & N. Hogan (1985), *The coordination of arm movements: an experimentally confirmed mathematical model*, Journal of Neuroscience 5(7): 1688–1703. No URL checked. | bibliographic details confirmed in several later reference lists; paper not read | The minimum-jerk model of arm movement. Human reaching has a smooth, bell-shaped speed profile (a later J Neurosci paper attributes that profile to this work). |

---

## 2. Facts used in the video

| Claim (as spoken or shown) | Value | Source # | Caveat stated on screen |
|---|---|---|---|
| Google said in 2013 that its risk analysis covers what a visitor does around the challenge. | — | 1 | Google's own description, paraphrased. |
| In 2014 the checkbox let many people pass with one click. | "many people, one click" | 2 | — |
| A visitor who cannot be judged gets a puzzle. | — | 2, 8 | — |
| Google's FAQ calls the `_GRECAPTCHA` cookie essential to the risk analysis. | — | 4 | — |
| Google does not publish the full list of signals or how they are weighted. | — | Excerpts of 1–4 contain no full list; secondary sources say the same. | "Google has not published the signals or weights." |
| A 2021 survey says the checkbox records cursor movement, click location and hover time. | — | 8 | "A 2021 survey's description. Google has not confirmed the list." |
| The checkbox also records browser details and cookies. | — | 8 | Same caveat as above. |
| v3 returns a score from 0.0 to 1.0. 1.0 is very likely a good interaction; 0.0 is very likely a bot. | 0.0–1.0 | 3 | Google's documentation. |
| v3 has no checkbox. | — | 3 | — |
| Each site sets its own cutoff for each action. Google suggests starting at 0.5. | 0.5 | 3 | "Google's suggested starting point; sites tune it." |
| A real hand never moves at one steady speed; it speeds up, peaks and eases into the target. | — | 10 | — |
| In 1985, Flash and Hogan modeled this as a smooth, bell-shaped rise and fall in speed. | — | 10 | — |
| One detector, BeCAPTCHA-Mouse, checks cursor paths against a model of human movement. | — | 9 | "Trained on puzzle drags, not checkbox clicks." |
| In a 2024 study of reCAPTCHA v2, any cursor movement cut the number of puzzles needed to pass. | — | 6 | "A research test, not Google's documentation." |
| A straight path and a curved one did not make a significant difference. | t = 0.58, p = 0.57 | 6 | Same caveat. |
| A 2024 study reports that cookies and browsing history carry substantial weight. | — | 6 | "Reported by researchers. Google has not confirmed browsing history." |
| In 2019, an AI agent moved and clicked in a simulator and reached a score of 0.9 about 97% of the time. | 97.4% (100×100); 96.7% (1000×1000) | 5 | "A simulator the researchers built, not the live site." |
| A 2023 study ran for 13 months with more than 3,600 people. Its authors judged the checkbox costly with close to no security gain. | 13 months; 3,600+ | 7 | "The authors' judgement." |

---

## 3. Deliberate simplifications

- **"The checkbox"** means reCAPTCHA v2's "I'm not a robot" widget. v3 has no checkbox and is shown
  separately, as a score.
- **"Google's verdict"** is described as a judgement from many signals. Google does not publish the
  full list or the weights, so the video names only what sources report and says that it is reported.
- **"The wobble".** The 2024 test found that movement mattered and that the shape of the path made no
  significant difference. The video does not claim that micro-wobble is measured, only that Google
  does not say.
- **Flash and Hogan (1985)** describe how a human arm moves when reaching. The video uses that shape
  as an analogy for what detectors check. It does not claim that reCAPTCHA scores against that model.
- **Numbers are rounded and attributed.** The simulator's success rates are described as "about
  ninety-seven percent" and labelled as simulator results.
- **The cookie name** appears on screen exactly as `_GRECAPTCHA`. The narration does not spell it out.

---

## 4. Things checked and rejected

- **"reCAPTCHA reads your browsing history."** Only researchers report this (row 6). No Google
  statement was found. The video says it is reported, not confirmed.
- **"Bots trace perfect arcs and humans wander in tiny, unrepeatable ways."** Found only in a
  secondary blog article, with no primary source. Not used.
- **A robot arm with a stylus that mimicked human-like motion.** Found only in a 2017 news report,
  with no primary source. Not used.
- **"52,000–59,000 checkbox challenges solved per day per IP address."** Appeared in one summary with
  no clear source. Not used.
- **A 2026 preprint claiming a reputation score from browser traits, cookies and history governs both
  v2 and v3.** Search excerpts disagreed about whether it says this. Not used.
- **"92.6% success across 500 live sessions"** (2026 preprint, *Robot Visions*). A single-source claim
  about image puzzles, not the checkbox. Not used.
- **"About 93% accuracy"** (row 9). Excerpts give conflicting sample counts. The video does not quote
  the number.
- **"Mean challenge count 8.38."** Appeared in two conflicting contexts in two summaries, so it is not
  used. The history-and-cookie comparison (median falling from five to two) rests on one excerpt, so
  the video describes it only qualitatively.
- **"100% solve rate"** (row 6). Not used. It is a solver's result, not a finding about the checkbox.
- **"Macro-driven checkbox clicks were not flagged as bots"** (row 7). Seen in a partial excerpt only.
  Not used.
- **"Before, during and after the click"** as a phrase from Google. It is a search summary's
  paraphrase, not the page's words. The video uses "around the challenge" from row 1 instead.
