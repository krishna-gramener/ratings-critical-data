import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/+esm";
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs";

const indicators = {
  "Employee Turnover": [
    "Overall assessment as Above industry average, increasing trend",
    "On par with industry average;On par with industry average, increasing trend",
    "On par with industry average, decreasing trend",
    "Below industry average, decreasing trend",
    "Not Reported",
  ],
  "Formal Talent Pipeline Development Strategy": ["Yes", "No", "Not Reported"],
  "Involvement in Developing or Distributing Hybrid or Electric Vehicles": [
    "No Value",
    "Pure play (revenues >50%)",
    "Core business (revenues 20-50%)",
    "Non-core involvement (revenues <20%)",
    "R&D underway / exploring opportunities",
    "Not Reported",
  ],
  "Involvement in Developing or Distributing LED Lighting": [
    "No Value",
    "Pure play (revenues >50%)",
    "Core business (revenues 20-50%)",
    "Non-core involvement (revenues <20%)",
    "R&D underway / exploring opportunities",
    "Not Reported",
  ],
  "Involvement in Generation or Development of Solar Power Capacity": [
    "No Value",
    "Pure play (revenues >50%)",
    "Core business (revenues 20-50%)",
    "Non-core involvement (revenues <20%)",
    "R&D underway / exploring opportunities",
    "Not Reported",
  ],
  "Involvement in Production or Distribution of Batteries": [
    "No Value",
    "Pure play (revenues >50%)",
    "Core business (revenues 20-50%)",
    "Non-core involvement (revenues <20%)",
    "R&D underway / exploring opportunities",
    "Not Reported",
  ],
  "Involvement in Production or Distribution of Industrial Automation Technologies": [
    "No Value",
    "Pure play (revenues >50%)",
    "Core business (revenues 20-50%)",
    "Non-core involvement (revenues <20%)",
    "R&D underway / exploring opportunities",
    "Not Reported",
  ],
  "Privacy Enhancing Technologies and Initiatives": [
    "Data protection safeguards integrated into product & service development",
    "Initiatives developed to protect and empower customers/users",
    "Basic education towards customers/users on how to protect themselves online",
    "Not Reported",
  ],
  "Innovation in Other Alternative Branchless Distribution Channels": [
    "Sector leading innovation in alternative branchless distribution channels targeting underserveddemographics",
    "Innovation in alternative branchless distribution channels targeting underserved demographics",
    "Alternative branchless distribution channels with some focus on targeting underserved demographics",
    "Evidence of alternative branchless distribution channels but no information on distributiontargeting underserved demographics",
    "Limited or no evidence of alternative branchless distribution channels",
  ],
  "Extent of Supply Chain Initiatives to Address Impacts of Timber and/or Paper Production": [
    "Requires all suppliers to produce or purchase sustainable timber/paper and verifies compliance",
    "In process of implementing sustainable timber purchasing requirements at core suppliers",
    "Has pilot projects on EITHER reducing environmental impact of pulp processing OR purchasing timber from identified sustainable and legal sources",
    "Educates suppliers on responsible timber/paper sourcing and production",
    "General Statement",
    "Not Reported",
  ],
  "Achievements on Packaging Content": [
    "Achievements have broad scope (company-wide or across all relevant packaging)",
    "There is evidence of improvement",
    "Achievements apply to individual product or package lines only",
    "General statement",
    "Not Reported",
  ],
  "SME Business - Assessment": [
    "Global leader on SME finance (over 40% of total lending)",
    "Above-average level of SME finance",
    "Average level of SME finance",
    "Below-average level of SME finance",
    "Limited evidence of SME finance",
    "Not reported",
  ],
};

const elements = {
  urlInput: document.getElementById("urlInput"),
  fileInput: document.getElementById("fileInput"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  loadingSpinner: document.getElementById("loadingSpinner"),
  errorAlert: document.getElementById("errorAlert"),
  results: document.getElementById("results"),
};

async function extractText(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let textWithPages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      textWithPages.push({ page: i, text: pageText });
    }
    return textWithPages;
  } catch (error) {
    throw new Error(`Error processing PDF: ${error.message}`);
  }
}

async function analyzeDocument(textWithPages) {
  //console.log("Indicators : ",JSON.stringify(indicators));
  const prompt = `Analyze the following text and extract information about these ESG indicators: ${Object.keys(
    indicators
  ).join(", ")}.

  For each indicator, provide the following in a structured format:

  Indicator: [Name]
  Present: [Yes/No]
  Confidence: [0-100]
  Evidence: [Direct quotes with page numbers]
  Comments: [Additional context or analysis]
  Conclusion: [each key in ${JSON.stringify(
    indicators
  )} is an indicator. Choose one value from its corresponding array of values which best describes the company's involvement in the indicator. If the company is not involved in the indicator, choose "No Value".]

  Separate each indicator with ---`;

  try {
    const text = textWithPages.map((p) => `[Page ${p.page}] ${p.text}`).join("\n");

    const response = await fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an ESG analysis expert. Provide detailed, evidence-based analysis in the exact structured format requested.",
          },
          { role: "user", content: prompt + "\n\nText to analyze:\n" + text },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    // console.log(data.choices[0].message.content);
    return parseAnalysisResults(data.choices[0].message.content);
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

function parseAnalysisResults(content) {
    // console.log("Content : ", content);
  const sections = content
    .split("---")
    .map((s) => s.trim())
    .filter((s) => s);
  return sections.map((section) => {
    const lines = section.split("\n");
    const result = {};

    lines.forEach((line) => {
      if (line.includes(":")) {
        const [key, ...value] = line.split(":");
        // Trim and clean up the key and value
        const cleanedKey = key.replace(/[\*\s]+/g, "").toLowerCase();
        // console.log("Cleaned Key : ", cleanedKey);
        const cleanedValue = value
          .join(":")
          .trim()
          .replace(/^["\*]+|["\*]+$/g, "");
        result[cleanedKey] = cleanedValue;
      }
    });

    // Normalize 'present' value only if it exists and is a valid string
    if (result.present) {
      result.present = result.present.toLowerCase();
    }

    return result;
  });
}

function displayResults(results) {
  elements.results.innerHTML = "";
  results.forEach((result, index) => {
    if (result && Object.keys(result).length > 0) {
      const presence = result.present.toLowerCase().includes("yes");
      const confidence = parseInt(result.confidence) || 0;

      const card = document.createElement("div");
      card.className = "accordion-item";
      card.innerHTML = `
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                            <i class="bi bi-clipboard-data me-2"></i>
                            ${result.indicator || indicators[index]}
                            <span class="presence-indicator ms-2 ${presence ? "presence-yes" : "presence-no"}">
                                ${presence ? "Present" : "Not Present"}
                            </span>
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            <div class="mb-3">
                                <label class="form-label">Confidence Score</label>
                                <div class="progress">
                                    <div class="progress-bar" role="progressbar" style="width: ${confidence}%">
                                        ${confidence}%
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Evidence</label>
                                <div class="evidence">
                                    ${result.evidence}
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Comments</label>
                                <div class="evidence">
                                    ${result.comments || "No additional comments"}
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Conclusion</label>
                                <div class="evidence">
                                    ${result.conclusion || "No additional comments"}
                                </div>
                            </div>

                        </div>
                    </div>
                `;
      elements.results.appendChild(card);
    }
  });
}

elements.analyzeBtn.addEventListener("click", async () => {
  elements.errorAlert.classList.add("d-none");
  elements.loadingSpinner.classList.remove("d-none");
  elements.results.innerHTML = "";

  try {
    let textWithPages;
    if (elements.urlInput.value) {
      const response = await fetch(
        `https://llmfoundry.straive.com/-/markdown?n=0&url=${encodeURIComponent(elements.urlInput.value)}`
      );
      const text = await response.text();
      textWithPages = [{ page: 1, text }];
    } else if (elements.fileInput.files[0]) {
      textWithPages = await extractText(elements.fileInput.files[0]);
    } else {
      throw new Error("Please provide a URL or upload a PDF file");
    }

    const analysis = await analyzeDocument(textWithPages);
    displayResults(analysis);
  } catch (error) {
    console.error("Error : ", error);
    elements.errorAlert.textContent = error.message;
    elements.errorAlert.classList.remove("d-none");
  } finally {
    elements.loadingSpinner.classList.add("d-none");
  }
});

async function getBase64FromPdf(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert PDF to base64: ${error.message}`);
    }
  }

async function extractTextUsingGemini(base64Pdf) {
    try {
      const response = await fetch(
        "https://llmfoundry.straive.com/gemini/v1beta/models/gemini-1.5-flash-latest:generateContent",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            system_instruction: {
              parts: [
                {
                  text: `Extract and return only the text content from the provided PDF.
                  Data Should be in following format :-
                  {
                  Complete Extracted Text,
                  Creditor,
  Borrower,
  Account Number,
  Annual Percentage Rate (APR),
  Finance Charge,
  Amount Financed,
  Total of Payments,
  Monthly Payment Amount,
  Number of Payments,
  Returned Payment Fee,
  Origination Fee,
  Late Charges,
                }
  return in json format only.
                  `,
                },
              ],
            },
            contents: [
              {
                role: "user",
                parts: [
                  { text: "This is a PDF document for text extraction." }, // Added the `text` field to describe the PDF
                  {
                    inline_data: {
                      mime_type: "application/pdf",
                      data: base64Pdf.split(",")[1], // Base64 content excluding the prefix
                    },
                  },
                ],
              },
            ],
          }),
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Unexpected error: ${response.status}`);
      }
  
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }