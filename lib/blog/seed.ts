import type { Article } from "./schema";

// Editorial drafts: no claimed customer outcomes and no invented personal author.
export const seedArticles: Article[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    slug: "what-is-custom-ai-development",
    title:
      "What Is Custom AI Development, and When Does a Business Actually Need It?",
    excerpt:
      "Start with the decision you need to improve. A practical guide to choosing between rules, existing AI tools and a model built around your business.",
    category: "Custom AI",
    tags: ["Machine learning", "Data readiness"],
    featured: true,
    content: `## Begin with a business decision

Custom AI development means designing a system around a specific task, its data and the conditions in which it will operate. That may involve training a predictive model, adapting an existing model or integrating a model with business software. It does not always mean building a neural network from scratch.

Consider an operations team that needs to identify unusual orders before fulfilment. The useful question is which orders merit review and how much review capacity is available. A model score alone does not answer that question. The workflow needs a threshold, an owner and a way to correct mistakes.

## Automation and AI solve different parts of the problem

Ordinary automation follows explicit rules: send an invoice when an order is confirmed, route a form by region, or notify an account owner when a deadline passes. These rules are often the most dependable solution when the conditions are clear.

A learned model estimates a pattern from examples. It may predict demand, classify a document or rank an unusual transaction. Its outputs can be wrong, so the surrounding automation needs validation, exceptions and human oversight. An AI agent adds tool use, but still needs explicit permissions and approval for consequential actions.

## When custom work is justified

- Your task has patterns that are difficult to express as stable rules.
- Available products do not fit your data, integration needs or evaluation requirements.
- You can access representative examples with permission to use them.
- An improved decision has enough value to justify development and ongoing maintenance.

First compare against a simple baseline and an existing product. If a rule or a standard tool meets the acceptance criteria, custom training may add cost without improving the outcome.

## Data readiness is a practical constraint

List where the data comes from, who owns it, what is missing and how the desired outcome is recorded. Historical decisions are not necessarily good labels: they can encode mistakes or inconsistent practice. Rare events may have too few examples for reliable evaluation.

Separate training and evaluation data before learning preprocessing rules. Information from the evaluation set can otherwise leak into development and make a model appear stronger than it will be on new data. The [scikit-learn guide to common pitfalls](https://scikit-learn.org/stable/common_pitfalls.html) explains this evaluation risk.

## Agree on acceptance criteria before a prototype

Define the cost of a missed event and the cost of a false alarm. Specify how results will be checked on representative unseen examples. Measure useful workflow outcomes such as review workload, turnaround time and error rates, alongside model performance. Decide what evidence would justify stopping the project.

A prototype tests feasibility; it is not a production guarantee. A deployment also needs access controls, monitoring, a fallback process and a way to investigate incorrect outputs. Data and business processes change, so someone must own reassessment after launch.

## A sensible first conversation

Bring one workflow, a description of the available data and the decision you want to improve. Avoid sending sensitive records in an initial enquiry. [Discuss your AI project with Sanctum AI](/contact?service=Custom%20AI%20Engineering) to explore whether rules, an existing tool or a tailored model is the right next step.`,
    author: "Sanctum AI",
    cover_image: "",
    seo_title: "",
    seo_description: "",
    status: "draft",
    published_at: null,
    created_at: "2026-10-10T00:00:00Z",
    updated_at: "2026-10-10T00:00:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    slug: "computer-vision-aerial-business-intelligence",
    title:
      "How Computer Vision Can Turn Aerial Images Into Business Intelligence",
    excerpt:
      "From image tiles to geospatial records: how rooftop detection can support analysis, and where human review and reliable imagery still matter.",
    category: "Computer Vision",
    tags: ["Geospatial imagery", "Evaluation"],
    featured: false,
    content: `## An image becomes useful when it supports a decision

Aerial imagery can help analysts inspect large areas consistently. Computer vision estimates what appears in an image; geospatial processing connects those estimates to locations. A business workflow then turns the output into reviewable records, maps or further investigation.

Rooftop solar panel detection is one example: a detector could identify visible panel-like objects in aerial imagery and organise candidate locations for review. This is an application concept inspired by development work, not a claim of a completed client deployment or verified detection accuracy.

## Choose the task precisely

Image classification assigns a label to an image or tile. Object detection identifies candidate objects with bounding boxes. Segmentation estimates which pixels belong to an object. The right approach depends on whether you need a regional count, a candidate location or an outline.

Visible solar panels and roof suitability are different questions. A photograph cannot establish structural integrity, electrical capacity or a viable installation design. Shadows, reflections and dark roof materials can resemble panels. Automated results should be treated as candidates rather than verified site facts.

## A practical processing pipeline

1. Obtain imagery with suitable resolution, coverage, licensing and acquisition dates.
2. Preserve its coordinate reference system and geographic transformation.
3. Create representative labelled examples, including difficult negative examples.
4. Process tiles with enough overlap to reduce boundary misses.
5. Merge duplicate detections and transform pixel coordinates back into geographic coordinates.
6. Store candidate records with source imagery, confidence scores and a review status.

The model learns visual patterns; the tiling, coordinate conversion, deduplication and export are ordinary software and automation. Both parts need testing. A visually plausible box at the wrong map location is an operational failure.

## Evaluate beyond a single accuracy number

Hold out locations or imagery acquisitions that were not used in training. Adjacent tiles can contain nearly identical rooftops, so a random tile split may overstate generalisation. Compare results across roof types, lighting, resolution and regions.

Review false positives and missed objects. Precision describes how many detections are correct; recall describes how many target objects were found, for a defined matching rule and test set. The threshold changes that tradeoff. Confidence scores need validation and should not be presented as guaranteed probabilities.

Specify how much overlap counts as a match, how duplicate detections are handled and what level of manual review is affordable. Keep the evaluation set separate from repeated threshold tuning.

## The limitations belong in the output

Imagery can be old or obstructed. Small objects may occupy too few pixels to distinguish. A model trained in one area may behave differently elsewhere. Output records should retain the source date and make uncertainty visible rather than flattening it into a yes-or-no claim.

For operational use, define access permissions, retention, batch costs and a correction process. Monitor incoming imagery quality as well as model behaviour. Feasibility depends on the available dataset and a measurable evaluation plan.

## Explore a scoped prototype

Start with a small representative area and an agreed review process. [Talk to Sanctum AI about a computer vision project](/contact?service=Custom%20AI%20Engineering) to assess imagery, labels and integration requirements before committing to broader deployment.`,
    author: "Sanctum AI",
    cover_image: "",
    seo_title: "",
    seo_description: "",
    status: "draft",
    published_at: null,
    created_at: "2026-10-10T00:00:00Z",
    updated_at: "2026-10-10T00:00:00Z",
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    slug: "spreadsheets-to-predictive-demand-forecasting",
    title:
      "From Spreadsheets to Predictive Analytics: Forecasting Business Demand",
    excerpt:
      "Define the planning horizon, clean the history and test against simple baselines before using forecasts for staffing or resource decisions.",
    category: "Predictive Analytics",
    tags: ["Forecasting", "Operations"],
    featured: false,
    content: `## Define the planning decision first

A forecast is an estimate of a future quantity, not a promise. Begin with the action it will inform. A service business planning next week's staffing needs a different forecast from one assessing next quarter's capacity. Specify the unit, time interval, planning horizon and when a decision must be made.

For example, weekly appointment demand may support roster planning. Revenue forecasting also needs assumptions about prices, cancellations and payment timing. Do not treat a demand forecast as a complete financial plan.

## Give spreadsheet history a consistent meaning

Create one row per period and define what each column measures. Distinguish a zero from a missing value. Record changes in opening hours, product availability and how transactions are counted. Observed sales during a stockout can understate demand; cancelled bookings may require separate treatment.

Check duplicate records, time zones and late corrections. Keep a reproducible copy of the history used for each model version. Collect only information needed for the task and apply the same access rules used for operational data.

## Establish a baseline before choosing a model

Try a last-period forecast, a seasonal naive forecast or a moving average. Seasonal naive forecasting repeats the most relevant previous season, such as the same weekday in the prior week. These methods provide an inexpensive benchmark and may be adequate for a stable process.

Statistical models and machine learning can capture additional patterns. Features might include past demand, holidays and known promotions. More complex models are not automatically better. A short or inconsistent history can make sophisticated estimates fragile.

## Test the way the forecast will be used

Evaluate on later periods using only information that would have been available at each forecast date. Rolling-origin evaluation repeatedly moves the training endpoint forward and assesses subsequent periods. The [forecasting textbook's cross-validation chapter](https://otexts.com/fpp3/tscv.html) explains this approach.

A random split can give the training process access to future patterns. Even a chronological split can leak information if a feature contains finalised totals that were unavailable at prediction time. Forecast the actual planning horizon, not just one step ahead when decisions require several weeks.

Choose error measures that reflect the decision. Mean absolute error is interpretable in the target units. Percentage errors become problematic when demand is zero or very small. Also inspect whether underprediction is concentrated in busy periods and compare against the baseline.

## Communicate uncertainty alongside the estimate

Use a range where the method supports it, and check how often actual outcomes fall within that range on unseen periods. Wider ranges may be the honest result for longer horizons or volatile demand. The [prediction intervals chapter](https://otexts.com/fpp3/prediction-intervals.html) provides background.

Unexpected closures, market changes or a new offering can invalidate historical patterns. Forecasts need business review and a fallback planning process. Do not turn an estimate directly into an irreversible staffing decision without checking constraints and responsibility.

## Connect forecasting to a reliable workflow

The model estimates demand; ordinary automation imports records, schedules runs, sends reports and routes exceptions. Keep data checks, a run log and the baseline forecast visible. Monitor errors over time and reassess after meaningful operational changes.

Start with one measurable planning problem. [Discuss predictive analytics with Sanctum AI](/contact?service=Custom%20AI%20Engineering) to assess whether your history is suitable and how a prototype could be evaluated.`,
    author: "Sanctum AI",
    cover_image: "",
    seo_title: "",
    seo_description: "",
    status: "draft",
    published_at: null,
    created_at: "2026-10-10T00:00:00Z",
    updated_at: "2026-10-10T00:00:00Z",
  },
];
