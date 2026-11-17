# Sources — “How Bluetooth Works”

Research came before the script. Every number and every strong claim in the narration or on screen
traces to an entry here. The Bluetooth Core Specification was downloaded as HTML from bluetooth.com
(version 5.4, read 2026-11-17) and searched locally, so the spec quotations below are verbatim.

## 1. Primary sources

| # | Source | What it supports |
|---|---|---|
| 1 | Bluetooth SIG, *Bluetooth Core Specification v5.4*, Vol 2 Part A **Radio Specification** (BR/EDR), bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/br-edr-controller/radio-specification.html | §2: “The Bluetooth system operates in the 2.4 GHz ISM band. This frequency band is 2400 MHz to 2483.5 MHz.” Table 2.1: RF channels “f=2402+k MHz, k=0,...,78”; “RF channels are spaced 1 MHz”. Table 3.1 power classes: class 1 ≤ 100 mW, class 2 ≤ 2.5 mW, class 3 ≤ 1 mW. §3.1.1: “The Modulation is GFSK … A binary one shall be represented by a positive frequency deviation, and a binary zero shall be represented by a negative frequency deviation.” §4.1.2 Table 4.1: co-channel interference C/I 11 dB. |
| 2 | Bluetooth SIG, *Core Specification v5.4*, Vol 2 Part B **Baseband Specification**, …/br-edr-controller/baseband-specification.html | See the quotations in section 1a below: hop rate, 79 channels, hop sequence from the Central's clock and address, 625 µs slots, Central in even slots, frequency fixed for a packet, up to seven active Peripherals, the access code, collisions, the access correlator, retransmission at the next transmit occasion, AFH with N_min = 20 and channel classification, the clock's cycle of about a day. |
| 3 | Bluetooth SIG, *Core Specification v5.4*, Vol 1 Part A **Architecture** (glossary), …/architecture,-mixing,-and-conventions/architecture.html | “Consecutive hops normally correspond to different RF hop frequencies and occur at a standard hop rate of 1600 hops per second. These consecutive hops follow a pseudo-random hopping sequence, hopping through a 79 RF channel set, or optionally fewer channels when Adaptive Frequency Hopping (AFH) is in use.” |
| 4 | Bluetooth SIG, *Core Specification v5.4*, Vol 1 Part C **Core Specification Change History**, …/core-specification-change-history.html | “Changes from v1.1 to v1.2 … The major areas of improvement are: … Adaptive frequency hopping”. “Changes from v5.1 to v5.2 … LE Isochronous Channels” (the basis of LE Audio). |
| 5 | Bluetooth SIG, *Core Specification v5.4*, Vol 6 Part A **LE Physical Layer** and Part B **LE Link Layer**, …/low-energy-controller/physical-layer-specification.html, …/link-layer-specification.html | PHY §2: “The LE system uses 40 RF channels with center frequencies at a 2 MHz spacing from 2402 MHz to 2480 MHz.” LL §2.1.2: “It is intended that each Link Layer connection between any two devices … has a different Access Address” and “Each time it needs a new Access Address … the Link Layer shall generate a new random value.” Advertising Access Address 0x8E89BED6. LL channel classification: “The minimum number of used channels shall be 2.” |
| 6 | Bluetooth SIG, “Learn about Bluetooth — Tech overview”, bluetooth.com/learn-about-bluetooth/tech-overview/ (read 2026-11-17) | Classic “streams data over 79 channels in the 2.4GHz unlicensed industrial, scientific, and medical (ISM) frequency band”; LE “Transmitting data over 40 channels in the 2.4GHz unlicensed ISM frequency band”; table: “79 channels with 1 MHz spacing”, “40 channels with 2 MHz spacing (3 advertising channels/37 data channels)”; channel usage for both: “Frequency-Hopping Spread Spectrum (FHSS)”. |
| 7 | Bluetooth SIG, “Bluetooth reliability”, bluetooth.com/learn-about-bluetooth/key-attributes/reliability/ | “Bluetooth technology operates in the same 2.4 GHz ISM frequency band as Wi-Fi”; “it’s possible for a packet being transmitted between two Bluetooth devices to be corrupted or lost”; “Bluetooth technology has adopted several techniques to lower the probability of collisions”. |
| 8 | Bluetooth SIG, “LE Audio”, bluetooth.com/learn-about-bluetooth/feature-enhancements/le-audio/ and “Auracast — how it works”, bluetooth.com/auracast/how-it-works/ (read 2026-11-17) | LE Audio broadcast “enabling an audio source device to broadcast one or more audio streams to an unlimited number of audio sink devices”; “An unlimited number of in-range Auracast™ receivers will be able to join an Auracast™ broadcast from a nearby Auracast™ transmitter.” |
| 9 | Bluetooth SIG, *2025 Bluetooth Market Update — device forecast*, bluetooth.com/2025-market-update/trends/ (chart source: ABI Research, 2025) | “Bluetooth® device shipments are projected to surpass 5.3 billion units in 2025 and approach 8 billion by 2029.” (Background; not in the narration.) |
| 10 | Bluetooth SIG, “The story behind how Bluetooth® technology got its name”, bluetooth.com/about-us/bluetooth-origin/ | King Harald “Bluetooth” Gormsson; “In 1996, three industry leaders, Intel, Ericsson, and Nokia, met to plan the standardization”; “Jim Kardach from Intel suggested Bluetooth as a temporary code name”; the logo merges the runes ᚼ and ᛒ. (Background only — deliberately left out, see 4.) |
| 11 | Intel Support, “Different Wi-Fi Protocols and Data Rates” / 802.11n channel articles, intel.com/content/www/us/en/support/articles/000006529.html and …/000043358.html; Intel Killer Wi-Fi guidance …/000058989 | 2.4 GHz Wi-Fi: “only three non-overlapping channels allowed for the North American Region”, channel 1 spanning 2402–2422 MHz (a 20 MHz channel); “always choose Channels 1, 11, or 6”. Cross-checked: University of Michigan WICS wiki “IEEE 802.11: Channels” (802.11b DSSS 22 MHz, 802.11g OFDM 20 MHz). |
| 12 | USDA Food Safety and Inspection Service, “Microwave Ovens and Food Safety”, fsis.usda.gov | The oven's magnetron transmits at about 2,450 MHz — inside the same 2.4 GHz band. |
| 13 | Bose Corporation, US Patent 10,705,793 B1, “Low latency mode for wireless communication between devices” (patents.google.com/patent/US10705793B1/en) | Headphones “include an incoming audio buffer, such as a render buffer, that buffers at least a portion of an incoming audio signal (e.g., audio packets) in order to allow time for retransmissions of any missed or dropped data packets”; “Most Bluetooth audio output devices on the market have a latency of around 150 ms for high quality A2DP audio”; reducing the buffer “may cause audio dropouts under challenging RF conditions.” |
| 14 | US Patent 2,292,387, H. K. Markey (Hedy Lamarr) and G. Antheil, “Secret Communication System”, granted 1942-08-11; Lemelson-MIT, “Hedy Lamarr” | Frequency hopping across 88 frequencies kept in step by perforated rolls. (Checked; not used — see 4.) |

### 1a. Verbatim quotations from the Baseband Specification (source 2)

- §2.1: “For each reception or transmission event an RF channel is selected by the hop selection kernel … The maximum hop rate is 1600 hops per second in the Connection state … and the maximum is 3200 hops per second in the Inquiry and Page substates.”
- §2.2.2: “The basic piconet physical channel is characterized by a pseudo-random hopping through all 79 RF channels. The frequency hopping in the piconet physical channel is determined by the Bluetooth clock and BD_ADDR of the Central. When the piconet is established, the Central's clock is communicated to the Peripherals. Each Peripheral shall add an offset to its native clock to synchronize with the Central's clock.”
- §2.2.1/§2.2: “the device that initiates a connection by paging is the Central. Once a piconet has been established, the Central and Peripheral may exchange roles.”
- §2.2.3: “The basic piconet physical channel is divided into time slots, each 625 μs in length.” §2.2.5: “The Central transmission shall always start at even numbered time slots (CLK1=0) and the Peripheral transmission shall always start at odd numbered time slots”.
- §2.6.3: “The RF frequency shall remain fixed for the duration of the packet. The RF frequency for the packet shall be derived from the Bluetooth clock value in the first slot of the packet.”
- §1.1: “Up to seven Peripherals can be active in the piconet. The channel access is controlled by the Central.”
- §1.3: “In the Bluetooth system all transmissions over the physical channel begin with an access code.” “The channel access code … forms the beginning of all packets exchanged on the piconet physical channel. The channel access code shall be derived from the LAP of the Central’s BD_ADDR.” “The receiver correlates against the entire synchronization word in the access code, providing very robust signaling.”
- §2 (physical channels): “Given that the number of RF carriers is limited and that many Bluetooth devices could be operating independently within the same spatial and temporal area there is a strong likelihood of two independent Bluetooth devices having their transceivers tuned to the same RF carrier, resulting in a physical channel collision. To mitigate the unwanted effects of this collision each transmission on a physical channel starts with an access code that is used as a correlation code by devices tuned to the physical channel.”
- §2.2.5.1: “the access correlator shall search for the correct channel access code over the uncertainty window. If an event trigger does not occur the receiver may go to sleep until the next RX event.” “If a trigger event occurs, the receiver shall remain open to receive the rest of the packet unless the packet is for another device, a non-recoverable header error is detected, or a non-recoverable payload error is detected.”
- §7.6 (ARQ): “if a NAK (explicit or implicit) is received instead … the same payload is retransmitted at the next TX occasion.” §4.4: “For most ACL packets, packet retransmission is applied to assure data integrity.”
- §2.3.1: “Each physical link on the adapted piconet physical channel shall use at least N min RF channels (where N min is 20).” §2.6.3: “When hop sequence adaptation is enabled, the number of used RF channels may be reduced from 79 to some smaller value N.” “Unused RF channels are re-mapped uniformly onto used RF channels.”
- §8.6.8: “RF channels are classified as being unknown, bad or good.” “A channel may be classified as bad if an ACL or synchronous throughput failure measure associated with it has exceeded a threshold”.
- §1.1 (clock): “The clock has a cycle of about a day. … a 28-bit counter … The least significant bit (LSB) shall tick in units of 312.5 μs”. Table 2.2 (hop kernel): input F = 16 × CLK27–7 mod 79, i.e. the sequence depends on every clock bit up to 27.

### How this topic is usually told (for creative direction, not for facts)

Searches for short explainers (titles, descriptions, write-ups; nothing downloaded) show two default
treatments. (1) The trivia treatment, in most listicles and shorts: the name comes from a Viking king,
the logo is two runes, and often “Hedy Lamarr invented the technology behind Bluetooth”. (2) The
mechanism treatment, best known from a widely shared long-form explainer (2021) and the clips cut from
it: radio waves drawn as glowing coloured waves or expanding spheres, an analogy with colours of light
or traffic lights (“your antenna turns purple when it sends a 1”), and the numbers 79 channels, 1,600
hops a second, a million bits a second. Neither treatment is built around the viewer's actual puzzle —
a crowd of earbuds sharing one band — and none shows that collisions really happen and are survived.
The look is almost always the brand's blue on black.

## 2. Facts used in the video

| Claim (as spoken or shown) | Value | Source # | Caveat |
|---|---|---|---|
| Everyone's earbuds are on the same slice of radio | 2.4 GHz ISM band, 2400–2483.5 MHz, unlicensed | 1, 6 | — |
| Same band as café Wi-Fi and microwave ovens | Wi-Fi 2.4 GHz channels 1–11 (2402–2472 MHz); ovens ≈ 2,450 MHz | 7, 11, 12 | — |
| Nobody owns it | “unlicensed … ISM frequency band” | 6 | — |
| Classic Bluetooth splits it into 79 channels, 1 MHz each | f = 2402 + k MHz, k = 0…78 | 1, 6 | On screen “CLASSIC BLUETOOTH”; Bluetooth LE uses 40 × 2 MHz (shown as a footnote) |
| It changes channel up to 1,600 times a second | “The maximum hop rate is 1600 hops per second in the Connection state” | 2, 3 | “up to”: a 3- or 5-slot packet stays on one channel |
| Every 0.625 ms (on the timetable board) | 625 µs slots | 2 | — |
| The pattern is worked out from your phone's address and its clock | “determined by the Bluetooth clock and BD_ADDR of the Central” | 2 | Usually the phone is the Central; roles can swap — the pattern belongs to whichever device is Central |
| The earbuds work out the same pattern and stay in step | “the Central's clock is communicated to the Peripherals … add an offset … to synchronize” | 2 | — |
| Every packet starts with a code made from your phone's address | channel access code derived from the Central's LAP, begins every packet | 2 | — |
| The earbuds only accept packets with that code; others are ignored | the access correlator searches for the correct channel access code; no trigger → no reception | 2 | — |
| Two phones will sometimes land on the same channel at the same instant; the rulebook calls it a “strong likelihood” | spec §2, quoted above | 2 | — |
| A pair of independently hopping links shares a channel about 1 hop in 79 | Arithmetic: two independent uniform choices among 79 channels coincide with probability 1/79 ≈ 1.3 %; the standard unconditional figure in the literature (IEEE 802.15 TG2 contribution 00322r0; Peterson et al., IEEE Commun. Letters) | 2, own arithmetic | Shown as “≈ 1 in 79”; real hop sequences are not independent random draws, and real traffic is not continuous |
| The garbled packet isn't confirmed, so the phone sends it again on the next hop | ARQ: NAK → “retransmitted at the next TX occasion”; each packet's channel is set by the clock at its first slot | 2 | “normally” a different channel (consecutive hops normally differ) |
| A few milliseconds later | next Central transmit occasion: 1.25 ms (single-slot) to 3.75 ms (5-slot packets) | 2 | — |
| Earbuds keep a fraction of a second of music in reserve, so a resend arrives in time | render buffer “to allow time for retransmissions”; ≈ 150 ms typical A2DP latency | 13 | Product-dependent; spoken as “a fraction of a second” |
| A Wi-Fi network covers about twenty of those channels | a 2.4 GHz Wi-Fi channel is 20 MHz wide (channel 1 = 2402–2422 MHz) = 20 Classic channels | 1, 11 | “about” (22 MHz for old 802.11b) |
| Your phone keeps score and drops channels that keep failing | AFH: channels classified bad when throughput failure exceeds a threshold; the Central sets the channel map | 2 | — |
| …but always keeps at least twenty | N_min = 20 | 2 | — |
| Newer Bluetooth can broadcast one stream to any number of earbuds | LE Audio broadcast / Auracast: “unlimited number of audio sink devices” | 4, 8 | “Newer” = LE Audio (from Core 5.2); needs a phone and earbuds that support it |
| The timetable shown is real | The hop sequences drawn are computed with the spec's hop selection kernel (Baseband §2.6) for an example address and clock, checked against the spec's sample data (Vol 2 Part G) — see `docs/report_notes.md` | 2 | The address is an example, not a real device |

## 3. Deliberate simplifications

- **“Your phone” runs the timetable.** The spec says the Central's clock and address decide the hop
  pattern; in a phone–earbud link that is normally the phone, but roles can be switched. The narration
  says “your phone”; the accuracy notes say “usually”.
- **True wireless earbuds are two radios.** How the second earbud gets its audio varies (relayed by the
  first earbud, listening in on the phone's link, or — with LE Audio — its own stream). The video treats
  “your earbuds” as one receiver; every mechanism shown applies to each link.
- **Classic numbers.** Most of the video uses Bluetooth Classic (BR/EDR) figures: 79 × 1 MHz channels and
  up to 1,600 hops/s. Bluetooth LE (and LE Audio) uses 40 × 2 MHz channels and hops once per connection
  or isochronous event; the same three defences — hopping, a per-link access address, retransmission and
  channel maps — apply. A footnote on screen names LE's numbers.
- **The hop map is slowed down.** 1,600 hops a second cannot be watched; the map scrolls at a few hops per
  second and says so (“slowed ×400”).
- **Collisions.** Two packets on one channel at once are not always both lost: a much stronger signal can
  survive an interferer (the co-channel requirement is C/I 11 dB, source 1). The video shows the simple
  case, where both are garbled.
- **Encryption.** Packets are also encrypted with keys made at pairing. Left out: it protects against
  deliberate eavesdroppers, not against accidental clashes, which is the question asked.
- **No numbers about a real carriage.** “Forty people” is a picture of a crowded carriage, not a
  measurement; no collision rate for a real train is claimed.

## 4. Things checked and rejected

- **The Viking-king name story** (source 10) — true, but it is the first thing every Bluetooth explainer
  says and it does not answer the question. Left out.
- **“Hedy Lamarr invented Bluetooth.”** Her 1942 patent (source 14) describes frequency hopping across 88
  frequencies, but there is no documented chain from it to Bluetooth's design; the popular claim
  overstates the lineage. Left out rather than told with a caveat that would take more time than it is worth.
- **“Bluetooth hops 1,600 times a second, always.”** It is the maximum in the connection state; audio
  streaming often uses 3- and 5-slot packets that stay on one channel, so the real rate is lower. Said as
  “up to”.
- **“Bluetooth has a range of 10 metres.”** The spec defines power classes, not ranges. Not used.
- **A collision probability for a whole carriage** (e.g. 1 − (78/79)^39 ≈ 39 %) — it assumes every link
  transmits continuously and that every overlap destroys both packets, neither of which is true. Not used.
- **“Advertising channels 37/38/39 sit between Wi-Fi channels 1, 6 and 11.”** Widely repeated (true by
  design intent), but the spec does not state the reason. Not used.
