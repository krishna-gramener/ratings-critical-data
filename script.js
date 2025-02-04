import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/+esm";
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs";

const { token } = await fetch("https://llmfoundry.straive.com/token", { credentials: "include" }).then((r) => r.json());
const $dropdown = document.getElementById("dropdown");
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

// Create and append dropdowns
const dropdownContainer = document.createElement('div');
dropdownContainer.className = 'container mb-3';
dropdownContainer.style.marginTop = '20px';

// Create row for grid system
const row = document.createElement('div');
row.className = 'row';

// Create columns for each dropdown
const col1 = document.createElement('div');
col1.className = 'col-md-6';
const col2 = document.createElement('div');
col2.className = 'col-md-6';

// Create indicator keys dropdown
const indicatorSelect = document.createElement('select');
indicatorSelect.className = 'form-select';
Object.keys(indicators).forEach(key => {
  const option = document.createElement('option');
  option.value = key;
  option.textContent = key;
  indicatorSelect.appendChild(option);
});

// Create values dropdown
const valueSelect = document.createElement('select');
valueSelect.className = 'form-select';

// Add labels for dropdowns
const label1 = document.createElement('label');
label1.className = 'form-label';
label1.textContent = 'View Indicator';
const label2 = document.createElement('label');
label2.className = 'form-label';
label2.textContent = 'View Value';

// Update values dropdown based on selected indicator
function updateValueDropdown() {
  const selectedIndicator = indicatorSelect.value;
  valueSelect.innerHTML = '';
  indicators[selectedIndicator].forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    valueSelect.appendChild(option);
  });
}

// Initial population of values dropdown
updateValueDropdown();

// Add event listener for indicator change
indicatorSelect.addEventListener('change', updateValueDropdown);

// Assemble the grid structure
col1.appendChild(label1);
col1.appendChild(indicatorSelect);
col2.appendChild(label2);
col2.appendChild(valueSelect);
row.appendChild(col1);
row.appendChild(col2);
dropdownContainer.appendChild(row);

// Insert dropdowns into the dropdown div
$dropdown.appendChild(dropdownContainer);

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

    const response = await fetch(
      "https://llmfoundry.straive.com/gemini/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `You are an ESG analysis expert. Provide detailed, evidence-based analysis in JSON format.
Your response must strictly follow this JSON schema:
{
  "type": "object",
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "indicator": {
            "type": "string",
            "description": "The name of the ESG indicator." ${Object.keys(indicators)
              .map((indicator) => `"${indicator}"`)
              .join(", ")}
          },
          "present": {
            "type": "string",
            "enum": ["Yes", "No"],
            "description": "Indicates whether the indicator is present or not."
          },
          "confidence": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
            "description": "A confidence level indicating the degree of certainty about the presence of the indicator."
          },
          "evidence": {
            "type": "string",
            "description": "Direct quotes with Page Number that provide evidence for the indicator's presence."
          },
          "comments": {
            "type": "string",
            "description": "Additional context or analysis regarding the indicator."
          },
          "conclusion": {
            "type": "string",
            "description": "The conclusion regarding the indicator's involvement, with options from ${JSON.stringify(indicators)} for each indicator, 'No Value' if not involved."
          }
        },
        "required": ["indicator", "present", "confidence", "evidence", "comments", "conclusion"]
      }
    }
  }
}

Return ONLY valid JSON that matches this schema exactly. Do not include any other text or explanation.`,
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Text to analyze:\n" + text,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    try {
      // Get the raw response text
      let responseText = data.candidates[0].content.parts[0].text;
      // Clean the response text more thoroughly
      responseText = responseText
        // Remove markdown code block
        .replace(/```json\n?|\n?```/g, '')
        // Remove any quotes around the entire JSON string
        .replace(/^["']|["']$/g, '')
        // Remove any extra whitespace at start and end
        .trim();
      
      // Parse the cleaned JSON response
      const llmResponse = JSON.parse(responseText);
      
      if (!llmResponse.results || !Array.isArray(llmResponse.results)) {
        throw new Error("Invalid response format: missing results array");
      }
      return llmResponse.results;
    } catch (parseError) {
      console.error("Failed to parse LLM response as JSON:", parseError);
      // Fallback to text parsing if JSON parsing fails
      return parseAnalysisResults(data.candidates[0].content.parts[0].text);
    }
  } catch (error) {
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

function parseAnalysisResults(content) {
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
      $dropdown.classList.remove("d-none");
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

      // Add click event listener to update dropdowns
      const button = card.querySelector('.accordion-button');
      button.addEventListener('click', () => {
        // Update indicator dropdown
        indicatorSelect.value = result.indicator;
        // Update value dropdown and select the conclusion
        updateValueDropdown();
        valueSelect.value = result.conclusion;
      });

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
