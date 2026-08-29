# South America — Web Accessibility Jurisdiction Mapping

Research date: 2026-08-29. Scope: primary-source legal research for Beacon jurisdiction mapping.

## Verdict summary

| Country | Verdict |
|---|---|
| Brazil | Own jurisdiction card — only South American law that binds private-sector websites directly, with a live enforcement action |
| Argentina | Own jurisdiction card — oldest law in the region (2010), real court enforcement, but public-sector scope only |
| Colombia | Own jurisdiction card — detailed technical standard (NTC 5854) plus a hard WCAG 2.1 deadline, public-sector only |
| Chile | Regional-tier note — solid public-sector decree, but derivative of the Brazil/Argentina/Colombia pattern, no distinct legal mechanism |
| Peru | Regional-tier note — nominally covers private sites too (rare in the region) but weakly enforced |
| Uruguay | Regional-tier note — newest and most technically current framework (WCAG 2.1, 2022 decree) but public-sector only, small market |
| Ecuador | Regional-tier note — has a real technical standard (INEN) and a private-sector-facing legal clause, but enforcement mechanism undocumented in public sources |
| Venezuela, Bolivia, Paraguay, Guyana, Suriname | Honest-null / low-confidence regional note only |

---

## Brazil

**Statute**: Lei Brasileira de Inclusao da Pessoa com Deficiencia (Estatuto da Pessoa com Deficiencia), Lei no 13.146, enacted 6 July 2015. Article 63 is the operative accessibility provision. English shorthand: Brazilian Law of Inclusion (LBI). No amendment to Art. 63 itself as of this research, but a new technical standard (ABNT NBR 17225) was published 11 March 2026 to give it technical teeth after roughly 10 years without one.

**Scope**: Both public and private. Art. 63 caput (Portuguese, quoted): "E obrigatoria a acessibilidade nos sitios da internet mantidos por empresas com sede ou representacao comercial no Pais ou por orgaos de governo" -- accessibility is mandatory for websites maintained by companies headquartered or with commercial representation in Brazil, or by government bodies. This is the only South American statute found that reaches private-sector websites by its own main clause, not a subsidiary/contractor carve-out. Paragraph 1 requires a visible accessibility symbol; paragraphs 2-3 cover public internet-access points (telecentros), requiring at least 10 percent (minimum 1) of terminals to have accessibility resources for visually impaired users.
Confidence: secondary-only for the exact paragraph text -- planalto.gov.br (the official gazette host) refused two direct fetch attempts (connection reset); the quoted Art. 63 text is corroborated by two independent secondary sources (modeloinicial.com.br, jusbrasil.com.br) with matching wording, and the scope description is independently confirmed by MPF's own public statements.

**Technical standard**: No binding technical parameter existed for 10 years. ABNT NBR 17225 (launched 11 March 2026, coordinated with Ceweb.br/CGI.br) is the first concrete technical norm implementing Art. 63. Whether NBR 17225 is mandatory or a voluntary reference standard was not confirmed in the sources found -- flag as an open item.
Confidence: secondary-only.

**Enforcement**: Ministerio Publico Federal (MPF) filed a civil public action (acao civil publica) against the Federal Union for failing to regulate Art. 63 for over a decade. A 2026 ruling (reported by Conjur, 8 July 2026) ordered the Union to produce a transition plan within 180 days to bring all federal public-administration websites into compliance, under a daily fine of R$10,000 for non-compliance with the court order. Separately, LBI carries criminal penalties for discrimination against a person with disability (1-3 years imprisonment plus fine) and for disobeying a court order issued in a civil public action (1-4 years plus fine); civil public action fines can exceed R$1 million in aggregate.
Confidence: verified for the existence and general shape of the MPF action (corroborated across MPF's own site, Conjur, and two other outlets); secondary-only for the exact fine figures.

Sources:
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm (official statute host, fetch failed twice, listed for reference)
- https://modeloinicial.com.br/lei/L-13146-2015/lei-brasileira-inclusao-pessoa-deficiencia-estatuto-pessoa-deficiencia/art-63
- https://www.mpf.mp.br/o-mpf/unidades/pr-sp/noticias/mpf-exige-que-a-uniao-defina-regras-para-garantir-acessibilidade-em-sites-publicos-e-privados
- https://www.conjur.com.br/2026-jul-08/uniao-deve-implementar-adaptacoes-de-acessibilidade-nos-sites-federais/
- https://www.cgi.br/noticia/releases/desenvolvida-com-coordenacao-do-ceweb-br-nova-norma-da-abnt-estabelece-requisitos-para-melhorar-a-acessibilidade-de-sites/

---

## Argentina

**Statute**: Ley 26.653 de Accesibilidad de la Informacion en las Paginas Web (Web Information Accessibility Law), sanctioned 3 November 2010, published in Boletin Oficial No. 32,038 on 30 November 2010. Regulatory detail added by Disposicion ONTI No. 2/2014 ("Estandar de Accesibilidad Web 2.0"), and current state procurement practice is increasingly requiring WCAG 2.1 AA.
Confidence: verified (fetched directly from argentina.gob.ar, the official government normativa portal).

**Scope**: Public sector, broadly defined, plus state contractors and subsidy recipients -- not general private enterprise. Covers: the national State (all three branches), decentralized/autonomous bodies, non-state public entities, state-owned companies, and private companies holding public-service concessions. Also reaches private contractors of goods/services to the State and civil-society entities receiving state subsidies, donations, or benefits -- Art. 10 makes continued eligibility for contracts/benefits conditional on compliance. General private-sector websites with no state relationship are outside scope.
Confidence: verified.

**Technical standard**: WCAG-based. ONTI's 2014 disposition adopted WCAG 2.0; current procurement is trending toward WCAG 2.1 AA as a bidding requirement (not yet a hard statutory floor). Implementation timeline in the original law: 12 months for new pages, 24 months for existing pages, with progressive conformity thresholds (50 points first evaluation period, 80 points second).
Confidence: verified for WCAG 2.0 adoption; secondary-only for the 2.1 AA procurement trend (described as a practice, not a codified rule).

**Enforcement**: Enforcing authority is the Secretaria de Gobierno Digital e Innovacion Tecnologica (successor to ONTI's original role), which can impose administrative sanctions on officials and seek judicial enforcement. Real case: Federal Administrative Contentious Court No. 3 ruled (13 April 2021) in a suit brought by visually impaired lawyers with ACIJ against the National Judicial Council and Supreme Court of Justice, ordering the Judiciary's digital case-management portal to be made screen-reader accessible. The court explicitly invoked Ley 26.653 and found the State in "absolute omission" of a mandatory duty.
Confidence: verified (ACIJ's own case writeup, fetched directly, names court, date, parties, and statutory basis).

Sources:
- https://www.argentina.gob.ar/normativa/nacional/175694/texto
- https://observatorioplanificacion.cepal.org/es/marcos-regulatorios/ley-26653-accesibilidad-de-la-informacion-en-las-paginas-web-de-argentina
- https://acij.org.ar/un-nuevo-fallo-obliga-a-la-justicia-nacional-a-garantizar-accesibilidad-en-su-sitio-web-para-que-personas-con-discapacidad-visual-puedan-utilizarlo-en-condiciones-de-igualdad/
- https://www.argentina.gob.ar/jefatura/innovacion-publica/onti/evaluacion-accesibilidad-web

---

## Colombia

**Statute**: Resolucion 1519 de 2020 (MinTIC -- Ministerio de Tecnologias de la Informacion y las Comunicaciones), issued under the umbrella of Ley 1712 de 2014 (Ley de Transparencia y del Derecho de Acceso a la Informacion Publica Nacional / Transparency and Right to Public Information Access Law). Resolution 1519 sets out web-accessibility, information-transparency, digital-security, and open-data directives together.
Confidence: verified -- quote pulled directly from the National Institute for the Blind (INCI, a government body)'s own announcement of the resolution.

**Scope**: Public entities only ("sujetos obligados" under Ley 1712, obligated subjects for public information disclosure). No private-sector obligation found in this resolution.
Confidence: verified.

**Technical standard**: WCAG 2.1 (level not specified in the located text) or NTC 5854:2011 (the Colombian national technical standard, itself grouped into A/AA/AAA conformity tiers) as an accepted alternative. Hard deadline: public entities were required to meet WCAG 2.1 by 1 January 2022.
Direct quote (Spanish): "A partir del 1 de enero del 2022, las entidades publicas deberan dar cumplimiento a los estandares de la Guia de Accesibilidad de Contenidos (Web Content Accessibility Guidelines -- WCAG) en su version 2.1."
Confidence: verified for the WCAG 2.1 plus deadline text; uncertain on which conformity level (A/AA/AAA) is mandated -- not stated in the sources reviewed, flag for follow-up.

**Enforcement**: No specific penalty schedule or real enforcement case for web accessibility located. A related but distinct Constitutional Court case (T-553/11) ordered the Judicial Council to build physical/architectural accessibility (elevators, ramps) into a courthouse -- not a web-accessibility ruling, included here only to record that it was checked and is not applicable.
Confidence: verified that no web-accessibility enforcement case was found (honest absence, not an unchecked gap).

Sources:
- https://www.inci.gov.co/blog/inci-celebra-expedicion-de-la-resolucion-1519-de-2020-que-emite-lineamientos-sobre
- https://gobiernodigital.mintic.gov.co/692/w3-article-160997.html
- https://gobiernodigital.mintic.gov.co/692/articles-160770_Directrices_Accesibilidad_web.pdf (official PDF; located but not machine-readable via fetch tooling)
- https://www.corteconstitucional.gov.co/relatoria/2011/T-553-11.htm (checked, not applicable -- physical not web accessibility)

---

## Chile

**Statute**: Ley 20.422 (2010) establishes the general equal-opportunity framework for persons with disabilities. Web accessibility is operationalized by Decreto No. 1 (approved, published in the Diario Oficial 11 June 2015), which approves a technical standard ("Norma Tecnica sobre Sistemas y Sitios Web") for State Administration bodies.
Confidence: secondary-only for the decree's exact text (sourced via vLex Chile summary, not the Diario Oficial directly); the underlying law's existence and year are corroborated across multiple sources.

**Scope**: Public sector only. Decree 1's technical standard applies to organs of the State Administration listed under Art. 1 of Ley 18,575 (Constitutional Organic Law on General Bases of State Administration), explicitly excluding state-created public enterprises.
Confidence: secondary-only.

**Technical standard**: WCAG 2.0, level AA, per SENADIS's 2017-updated web accessibility guide.
Confidence: secondary-only (SENADIS guide referenced but not fetched directly; consistent across three independent secondary sources).

**Enforcement**: No penalty schedule or real case found. A general "Programa de acceso a la justicia para personas con discapacidad" exists but nothing specific to web accessibility surfaced in this search.
Confidence: verified absence -- actively searched, none found.

Sources:
- https://vlex.cl/vid/decreto-num-1-publicado-573535414
- https://www.senadis.gob.cl/descarga/i/3676/documento
- https://blog.ida.cl/accesibilidad/accesibilidad-web-chile/
- https://accessibility.cl/accesibilidad-digital-municipal-chile-decreto-1-ley-21180-ley-20422-edli-overlays/

---

## Peru

**Statute**: Ley No. 29973, Ley General de la Persona con Discapacidad. Implementing regulation: Decreto Supremo No. 002-2014-MIMP (regulations for Ley 29973), with subsequent modifications tracked through 2024-2026 supreme decrees. A 2024 addition, Resolucion No. 002-2024-PCM/SGTD, created a "Sello de Accesibilidad Digital" (Digital Accessibility Seal), a voluntary certification, not a mandate.
Confidence: secondary-only -- direct fetch of the official PDF (congreso.gob.pe) timed out; scope/article claims rest on secondary summaries (gob.pe collections page, hiperderecho.org) that are consistent with each other.

**Scope**: Notably broader than most of the region -- the law (via a modification to Art. 3 of the earlier Ley 28530) reaches not only public entities and universities but also natural/legal persons providing information or other services to consumers through webpages, i.e. some private-sector reach. This is a stronger private-sector claim than Argentina, Chile, Colombia, or Uruguay, though weaker in enforcement than Brazil.
Confidence: secondary-only -- this is a load-bearing claim (private-sector scope) sourced from one aggregator (insuit.net) plus a general accesibilidadweb.dlsi.ua.es academic index; recommend independent verification against the Ley 28530 modification text before quoting in a customer-facing jurisdiction card.

**Technical standard**: Peruvian technical standards aligning with international norms have existed since 2016; exact WCAG version/level not confirmed in sources reviewed.
Confidence: uncertain.

**Enforcement**: CONADIS (Consejo Nacional para la Integracion de la Persona con Discapacidad) is the competent body for infractions/sanctions under Ley 29973. Non-compliance penalty is pegged to the UIT (Unidad Impositiva Tributaria, Peru's tax-unit index), estimated at S/5,150 for 2026 per infraction unit. No named real enforcement case for web accessibility specifically was found.
Confidence: secondary-only for the penalty figure; verified absence of a named case (searched, none found).

Sources:
- https://www.leyes.congreso.gob.pe/Documentos/Leyes/29973.pdf (official text; fetch timed out, listed for reference)
- https://www.insuit.net/es/normativas-accesibilidad-digital-latinoamerica/
- https://www.gob.pe/institucion/pcm/colecciones/73043-normativas-que-regulan-la-accesibilidad-digital-en-peru
- https://hiperderecho.org/2024/04/crean-sello-de-accesibilidad-digital-en-que-consiste/

---

## Uruguay

**Statute**: Ley No. 19.924, Art. 88 (framework provision), regulated in detail by Decreto No. 406/022 (approved late 2022, published 16 January 2023). Underlying disability-rights framework is the older Ley 18.651 (Comprehensive Protection of Persons with Disabilities, 2010).
Confidence: secondary-only -- IMPO (the official gazette/legal-text host, impo.com.uy) hosts the primary text at the URL found, but was not fetched directly in this pass; scope/content description relies on Abstracta's and AGESIC's own summaries, which agree with each other.

**Scope**: Public sector-centered -- departmental governments, autonomous entities, decentralized services, and non-state public entities -- plus specific private-activity sectors that the Executive Power may designate (an opt-in extension mechanism, not a general private mandate).
Confidence: secondary-only.

**Technical standard**: WCAG 2.1, levels A and AA, per Decreto 406/022, administered by AGESIC (Agencia de Gobierno Electronico y Sociedad de la Informacion y del Conocimiento), which is empowered to update minimum requirements over time referencing W3C-WAI recommendations. Existing public solutions require a diagnostic "improvement plan"; new developments must meet the standard from the outset.
Confidence: secondary-only, but this is Uruguay's own government agency's public description of its own decree, a high-reliability secondary source.

**Enforcement**: No penalty schedule or real case found.
Confidence: verified absence -- searched, none found.

Sources:
- https://www.impo.com.uy/bases/decretos-originales/406-2022
- https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento/comunicacion/noticias/se-aprobo-decreto-sobre-accesibilidad-digital
- https://abstracta.us/es/blog/accesibilidad-digital-adaptacion-normativa/

---

## Ecuador

**Statute**: Ley Organica de Discapacidades (Organic Law on Disabilities), plus its implementing Reglamento (Decreto Ejecutivo 194). Web accessibility is also addressed via a dedicated technical standard: NTE INEN-ISO/IEC 40500 (adopting WCAG 2.0 as Ecuador's national standard), published in the Official Registry 28 January 2014, with INEN 288 as the technical regulation mandating its application.
Confidence: secondary-only -- the organic law's exact article number for the web-accessibility clause was not pinned down in this pass (several PDF copies of the law were located but not individually fetched for the specific article); the INEN standard's existence, number, and publication date are corroborated across three independent sources.

**Scope**: States explicitly that both public and private institutions must have accessible websites -- a real private-sector-facing clause, comparable in ambition to Brazil's, but Ecuador's enforcement mechanism for the private-sector half is not documented in the sources found.
Confidence: secondary-only.

**Technical standard**: NTE INEN-ISO/IEC 40500 (= WCAG 2.0), mandatory per INEN 288. A commonly cited compliance milestone: as of 8 August 2018, all Ecuadorian websites providing a public service were required to meet WCAG 2.0 level A.
Confidence: secondary-only.

**Enforcement**: CONADIS (Consejo Nacional para la Igualdad de Discapacidades) directs monetary sanctions arising from Ley Organica de Discapacidades violations toward rights-promotion campaigns; no web-accessibility-specific sanction schedule or named case was found.
Confidence: uncertain on enforcement mechanics; verified absence of a named case.

Sources:
- https://www.consejodiscapacidades.gob.ec/accesibilidad-web-en-ecuador/
- https://accesibilidadenlaweb.blogspot.com/2014/02/ecuador-ya-tiene-una-norma-sobre.html
- https://www.aduana.gob.ec/archivos/Boletines/2012/LEY%20ORGANICA%20DE%20DISCAPACIDADES.PDF (official text located, article-level content not individually verified)
- https://www.redalyc.org/journal/5732/573263326006/html/

---

## Remaining South American countries -- honest-null / low-confidence

No specific web-accessibility law was confirmed for the following; each has at most a general disability-rights or transparency framework plus CRPD ratification status (not independently re-verified in this pass -- flag if CRPD status becomes load-bearing).

- **Venezuela**: Resolucion 026 de 2011 (Ministerio de Ciencia, Tecnologia e Industrias Intermedias), published in Gaceta Oficial No. 39,633 (14 March 2011), sets accessibility guidelines (not a binding law) for public-administration internet portals, referencing WCAG 1.0/2.0 structuring elements. Guidance-level, not statute-level, and public-sector only. Confidence: secondary-only, single-source-cluster.
- **Bolivia**: No web-accessibility law found. Constitutional recognition of disability rights and information access exists in general terms; a government-website standardization guide reportedly devotes one chapter to web accessibility, but this is administrative guidance, not law. Confidence: secondary-only, thin sourcing -- treat as unconfirmed rather than a solid "no law" finding.
- **Paraguay**: Ley 5282/2015 (public policy for national disability-rights action) is cited by one secondary source as requiring public-information websites to be "completely accessible," with Decreto 4064 as implementing regulation. This claim rests on a single secondary source cluster and was not corroborated against the official Gaceta Oficial text. Confidence: uncertain, recommend independent verification before use in any customer-facing material.
- **Guyana**: Persons with Disabilities Act 2010 (Cap. 36:05) is a general disability/anti-discrimination law covering physical and informational access; no web-specific accessibility provision or technical standard was found. Confidence: verified absence of a web-specific law (Act text located via ILO NATLEX and Parliament of Guyana, general scope confirmed).
- **Suriname**: No disability-specific or web-accessibility law surfaced in this search (language barrier -- Dutch-language primary sources were not searched). Confidence: uncertain due to search-method gap, not a confirmed "no law" finding -- flag for a Dutch-language follow-up if Suriname becomes relevant.

Sources:
- https://www.gacetaoficial.io/venezuela/2011-03-14-gaceta-oficial-39633
- https://accesibilidadweb.dlsi.ua.es/?menu=bolivia
- https://www.redalyc.org/journal/3505/350566284015/html/ (Paraguay)
- https://webapps.ilo.org/dyn/natlex/natlex4.detail?p_lang=en&p_isn=99459&p_country=GUY&p_count=195&p_classification=08.01&p_classcount=1
- https://www.parliament.gov.gy/publications/acts-of-parliament/persons-with-disability-act-2010

---

## Open items for follow-up

1. Colombia: which WCAG 2.1 conformity level (A/AA/AAA) Resolucion 1519 actually mandates -- not stated in sources reviewed.
2. Peru: independently verify the private-sector-scope claim (modification to Ley 28530 Art. 3) against the primary statute text -- currently single-source-cluster.
3. Brazil: confirm whether ABNT NBR 17225 (March 2026) is mandatory or a voluntary reference standard, and whether it formally regulates Art. 63 or merely informs it.
4. Ecuador: pin the exact article number in the Ley Organica de Discapacidades that states the public/private website-accessibility requirement.
5. Paraguay and Bolivia: both rest on thin (single-cluster) secondary sourcing -- do not present as settled facts in customer-facing material without a primary-source check.
6. Suriname: unresearched due to language gap; needs a Dutch-language pass, not currently a confirmed null.

## Verification pass 2026-08-29

Method: the researcher's earlier fetch of the official congreso.gob.pe host had timed out; a plain
`curl -sL -A "Mozilla/5.0"` retry (no Playwright needed — this is a static PDF, not JS-rendered)
succeeded and pulled the actual 15-page gazette PDF, read directly. Scope: only open item #2 (Peru
private-sector scope), the priority item this pass was asked to close out. Items #1, #3, #4, #5, #6
above were not re-checked this pass and remain open exactly as stated.

1. **Peru, private-sector website duty (open item #2) — VERIFIED (upgrade single-source-cluster →
   primary, quoted).** Fetched the official gazette PDF of Ley 29973 directly from
   leyes.congreso.gob.pe (El Peruano, 24 December 2012, pp. 482000-482014). The private-sector clause
   is not a later modification found only in secondary aggregators — it is written into Ley 29973
   itself, as its **Décima Tercera Disposición Complementaria Modificatoria** ("Modificación de la
   Ley 28530..."), which amends Article 3 of Ley 28530 to read (quoted verbatim):
   > "Artículo 3.- Adecuación de portales y páginas web
   > Las entidades públicas y las universidades deben incorporar en sus páginas web o portales de
   > Internet opciones de acceso para que las personas con discapacidad puedan acceder a la
   > información que contienen.
   > **Las personas naturales o jurídicas privadas que presten servicios de información al consumidor
   > y otros servicios a través de páginas web o portales de Internet deben incorporar en los mismos
   > opciones de acceso para personas con discapacidad.**
   > Para efectos de la presente Ley, son entidades públicas las señaladas en el artículo I del Título
   > Preliminar de la Ley 27444..."
   This confirms the file's load-bearing claim exactly: private natural/legal persons offering
   consumer-information or other services via websites/web portals have a direct statutory duty to
   build in accessibility options, on the same footing (same article, no separate enforcement
   carve-out visible in the text) as the public-entity/university duty in the same article. The
   article does not itself specify a technical standard or conformance level — that gap in the
   file's "Technical standard: uncertain" note stands. CONADIS's sanctioning authority (Título
   Preliminar-adjacent chapters, Arts. 80-85 of the same statute) is confirmed general-purpose
   (covers all Ley 29973 infractions, UIT-indexed fines per Art. 83, tiered leve/grave/muy grave), but
   nothing in the fetched text ties a specific sanction line item to Art. 3 of Ley 28530 by name, so
   "no named enforcement case for web accessibility specifically" (the file's existing finding)
   stands unchanged.
   Source: https://www.leyes.congreso.gob.pe/Documentos/Leyes/29973.pdf, page 13 of 15 (El Peruano
   gazette page 482013), fetched and read directly 2026-08-29.

**Counts for this pass**: 1 item checked, 1 verified, 0 contradicted, 0 unreachable. This upgrades
the Peru card's private-sector-scope claim from "recommend independent verification before use in
any customer-facing material" to safe-to-cite-with-quote. Items #1 (Colombia WCAG level), #3 (Brazil
ABNT NBR 17225 mandatory status), #4 (Ecuador article number), #5 (Paraguay/Bolivia sourcing), and #6
(Suriname) remain open.
