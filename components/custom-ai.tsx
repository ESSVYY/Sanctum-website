import Link from "next/link";
const capabilities = [
  [
    "Computer Vision",
    "Object detection, image classification, visual inspection and geospatial imagery analysis.",
  ],
  [
    "Predictive Analytics",
    "Demand forecasting, revenue forecasting, resource planning and predictive business insights.",
  ],
  [
    "Custom Machine Learning",
    "Classification, anomaly detection, recommendations and purpose-built predictive models.",
  ],
  [
    "AI Agents",
    "Intelligent assistants that use approved tools, access relevant business context and execute authorized workflows.",
  ],
  [
    "Document Intelligence",
    "Information extraction, document classification and structured data processing.",
  ],
  [
    "AI Integration & Deployment",
    "Model APIs, business applications, CRM integration, monitoring and ongoing optimization.",
  ],
];
export function CustomAiSection() {
  return (
    <section
      id="capabilities"
      className="engineering-section"
      aria-labelledby="engineering-title"
    >
      <div className="editorial-container">
        <div className="engineering-heading">
          <div>
            <p className="editorial-eyebrow">SANCTUM AI / CUSTOM ENGINEERING</p>
            <h2 id="engineering-title">
              Custom AI.
              <br />
              Engineered for Your Business.
            </h2>
          </div>
          <div>
            <p>
              Not every business challenge can be solved with an off-the-shelf
              automation. We design, develop and integrate AI systems tailored
              to your data, workflows and operational challenges.
            </p>
            <Link
              className="editorial-button"
              href="/contact?service=Custom%20AI%20Engineering"
            >
              Discuss Your AI Project <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="engineering-grid">
          {capabilities.map(([title, description], i) => (
            <article className="engineering-card" key={title}>
              <span className="engineering-number">0{i + 1} /</span>
              <svg aria-hidden="true" viewBox="0 0 48 48">
                <rect
                  x="8"
                  y="8"
                  width="32"
                  height="32"
                  rx={i % 2 ? "16" : "3"}
                />
                <path
                  d={
                    i % 3 === 0
                      ? "M16 24h16M24 16v16"
                      : i % 3 === 1
                        ? "M14 31l7-9 6 4 7-12"
                        : "M16 16l16 16M32 16L16 32"
                  }
                />
              </svg>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function AppliedAiSection() {
  const examples = [
    [
      "01",
      "Rooftop Solar Panel Detection",
      "Development-inspired application concept",
      "Computer vision applied to aerial imagery to identify potential rooftop solar installations and organize geospatial results. Candidate detections require validation and human review.",
    ],
    [
      "02",
      "Business Demand Forecasting",
      "Conceptual application",
      "Models that analyze historical operational data to predict demand and support staffing or financial decisions. Compare forecasts with simple baselines and communicate uncertainty.",
    ],
    [
      "03",
      "Automated Operational Intelligence",
      "Conceptual application",
      "Systems that combine business data, anomaly detection, automated reporting and recommended next actions. People remain responsible for reviewing exceptions and authorizing actions.",
    ],
  ];
  return (
    <section
      id="ai-applications"
      className="engineering-section engineering-applied"
      aria-labelledby="applied-title"
    >
      <div className="editorial-container">
        <p className="editorial-eyebrow">FROM DATA TO DECISIONS</p>
        <h2 id="applied-title">AI Applied to Real Business Problems</h2>
        <p className="editorial-intro">
          Examples of what tailored systems can support. These are application
          concepts, not verified client case studies.
        </p>
        <div className="engineering-grid">
          {examples.map(([n, title, label, text]) => (
            <article key={n} className="application-card">
              <span className="engineering-number">{n} / APPLICATION</span>
              <h3>{title}</h3>
              <p className="application-label">{label}</p>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className="engineering-note">
          Custom model development depends on suitable datasets, feasibility
          testing and measurable evaluation. We agree on success criteria before
          recommending a deployment.
        </p>
      </div>
    </section>
  );
}
export function AiProcessSection() {
  const steps = [
    [
      "Problem discovery",
      "Define the decision, workflow and measurable outcome.",
    ],
    [
      "Data assessment",
      "Review quality, permissions and representative examples.",
    ],
    [
      "Prototype development",
      "Test feasibility with a focused, transparent prototype.",
    ],
    [
      "Model evaluation",
      "Compare with baselines on unseen data and review errors.",
    ],
    [
      "Deployment and integration",
      "Connect securely, with monitoring and reliable fallbacks.",
    ],
    [
      "Monitoring and improvement",
      "Track performance, investigate changes and refine the system.",
    ],
  ];
  return (
    <section
      id="ai-development"
      className="engineering-section"
      aria-labelledby="ai-process-title"
    >
      <div className="editorial-container">
        <p className="editorial-eyebrow">A MEASURED APPROACH</p>
        <h2 id="ai-process-title">How we develop AI solutions</h2>
        <p className="editorial-intro">
          Measurable results. Transparent decisions. Operational reliability.
        </p>
        <ol className="engineering-process">
          {steps.map(([title, text], i) => (
            <li key={title}>
              <span className="engineering-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
