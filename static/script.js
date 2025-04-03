import * as pdfjs from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/+esm";
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs";

const { token } = await fetch("https://llmfoundry.straive.com/token", { credentials: "include" }).then((r) => r.json());
const $dropdown = document.getElementById("dropdown");
const $goldenSetDiv = document.getElementById("goldenSetDiv");
const $csvUpload = document.getElementById("csvUpload");
const $indicatorInfoCard = document.getElementById("indicatorInfoCard");
const $resultsDiv = document.getElementById("goldenSetResults");
const elements = {
  urlInput: document.getElementById("urlInput"),
  fileInput: document.getElementById("fileInput"),
  analyzeBtn: document.getElementById("analyzeBtn"),
  loadingSpinner: document.getElementById("loadingSpinner"),
  errorAlert: document.getElementById("errorAlert"),
  results: document.getElementById("results"),
};

const { indicators, indicatorsInformation } = await fetch("config.json").then((r) => r.json());

// Create a copy of the original indicator information that we can update
let updatedIndicatorsInformation = JSON.parse(JSON.stringify(indicatorsInformation));
let pdfName = "";
let analysis = "";
let llmResponseArray = [];

// Create and append dropdowns
const dropdownContainer = document.createElement("div");
dropdownContainer.className = "container mb-3";
dropdownContainer.style.marginTop = "20px";

// Create row for grid system
const row = document.createElement("div");
row.className = "row";

// Create columns for each dropdown
const col1 = document.createElement("div");
col1.className = "col-md-6";
const col2 = document.createElement("div");
col2.className = "col-md-6";

// Create indicator keys dropdown
const indicatorSelect = document.createElement("select");
indicatorSelect.className = "form-select";
Object.keys(indicators).forEach((key) => {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = key;
  indicatorSelect.appendChild(option);
});

// Create values dropdown
const valueSelect = document.createElement("select");
valueSelect.className = "form-select";

// Add labels for dropdowns
const label1 = document.createElement("label");
label1.className = "form-label";
label1.textContent = "View Indicator";
const label2 = document.createElement("label");
label2.className = "form-label";
label2.textContent = "View Value";

// Update values dropdown based on selected indicator
function updateValueDropdown() {
  const selectedIndicator = indicatorSelect.value;
  valueSelect.innerHTML = "";
  indicators[selectedIndicator].values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    valueSelect.appendChild(option);
  });
}

// Initial population of values dropdown
updateValueDropdown();

// Add event listener for indicator change
indicatorSelect.addEventListener("change", updateValueDropdown);

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

// Initially hide the indicator info card
$indicatorInfoCard.classList.add("d-none");

// Add toggle behavior for the chevron icon
document.getElementById("indicatorInfoHeader").addEventListener("click", function () {
  const chevron = this.querySelector(".bi-chevron-down, .bi-chevron-up");
  if (chevron.classList.contains("bi-chevron-down")) {
    chevron.classList.replace("bi-chevron-down", "bi-chevron-up");
  } else {
    chevron.classList.replace("bi-chevron-up", "bi-chevron-down");
  }
});

// Function to update textarea with indicator information
function updateIndicatorInfo(indicatorName = null) {
  // If no indicator name is provided, use the currently selected one from the dropdown
  const selectedIndicator = indicatorName || indicatorSelect.value;
  const infoTextarea = document.getElementById("indicatorInfoTextarea");

  // Update the dropdown to match the selected indicator
  if (indicatorName) {
    // Find the option with the matching value and set it as selected
    for (let i = 0; i < indicatorSelect.options.length; i++) {
      if (indicatorSelect.options[i].value === indicatorName) {
        indicatorSelect.selectedIndex = i;
        updateValueDropdown(); // Update the values dropdown as well
        break;
      }
    }
  }

  if (updatedIndicatorsInformation[selectedIndicator]) {
    const info = updatedIndicatorsInformation[selectedIndicator];

    // Check if the info is already in text format (from textarea)
    if (typeof info === "string") {
      infoTextarea.value = info;
    } else {
      // Convert structured data to text format
      let infoText = `Objective: ${info.Objective}\n\n`;

      infoText += "Focus Areas:\n";
      info["Focus Areas"].forEach((area) => {
        infoText += `- ${area}\n`;
      });
      infoText += "\n";

      infoText += "Inclusion Criteria:\n";
      info["Inclusion Criteria"].forEach((criteria) => {
        infoText += `- ${criteria}\n`;
      });
      infoText += "\n";

      infoText += "Exclusion Criteria:\n";
      info["Exclusion Criteria"].forEach((criteria) => {
        infoText += `- ${criteria}\n`;
      });
      infoText += "\n";

      infoText += `Accuracy Requirements: ${info["Accuracy Requirements"]}`;

      infoTextarea.value = infoText;
    }
  } else {
    infoTextarea.value = "No detailed information available for this indicator.";
  }
}

// Initial population of indicator information
updateIndicatorInfo();

// Add event listener for indicator change to update information
indicatorSelect.addEventListener("change", () => {
  // No need to explicitly save here since the input event listener handles it
  // Just update the dropdown and load the new indicator info
  updateValueDropdown();
  updateIndicatorInfo();
});

// Add event listener for textarea changes to automatically save them
document.getElementById("indicatorInfoTextarea").addEventListener("input", (e) => {
  const selectedIndicator = indicatorSelect.value;
  // Always save the current value, even if empty
  updatedIndicatorsInformation[selectedIndicator] = e.target.value;
});

// Add event listener for update button
document.getElementById("updateIndicatorInfoBtn").addEventListener("click", async () => {
  const infoTextarea = document.getElementById("indicatorInfoTextarea");
  const selectedIndicator = indicatorSelect.value;

  // Save the current textarea content before updating
  if (infoTextarea.value.trim()) {
    updatedIndicatorsInformation[selectedIndicator] = infoTextarea.value;
  }

  // Only proceed if we have an active analysis
  if (analysis) {
    elements.loadingSpinner.classList.remove("d-none");
    elements.results.innerHTML = "";
    elements.errorAlert.classList.add("d-none"); // Hide any previous error messages

    try {
      // Re-analyze with the updated indicator information
      const results = await analyzeDocument(analysis, updatedIndicatorsInformation);
      displayResults(results);
    } catch (error) {
      console.error("Analysis error:", error);
      elements.errorAlert.textContent = `Error: ${error.message}`;
      elements.errorAlert.classList.remove("d-none");
    } finally {
      elements.loadingSpinner.classList.add("d-none");
    }
  } else {
    elements.errorAlert.textContent = "Please analyze a document first.";
    elements.errorAlert.classList.remove("d-none");
  }
});

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

async function analyzeDocument(textWithPages, customIndicatorInfo = null) {
  try {
    const text = textWithPages.map((p) => `[Page ${p.page}] ${p.text}`).join("\n");

    // Determine which indicator information to use
    let indicatorInfoToUse = updatedIndicatorsInformation;
    if (customIndicatorInfo) {
      // If we have custom indicator info, use it for the specified indicator
      // but keep the rest of the indicators from the current updated information
      indicatorInfoToUse = { ...updatedIndicatorsInformation };

      // For each custom indicator, replace or add it to the information object
      Object.keys(customIndicatorInfo).forEach((indicator) => {
        // Get the custom text
        const customText = customIndicatorInfo[indicator];

        // Check if customText is a string before trying to split it
        if (typeof customText === "string") {
          const parsedInfo = {
            Objective: "",
            "Focus Areas": [],
            "Inclusion Criteria": [],
            "Exclusion Criteria": [],
            "Accuracy Requirements": "",
          };

          // Simple parsing of the formatted text
          const lines = customText.split("\n");
          let currentSection = null;

          lines.forEach((line) => {
            if (line.startsWith("Objective:")) {
              parsedInfo.Objective = line.replace("Objective:", "").trim();
              currentSection = null;
            } else if (line.startsWith("Focus Areas:")) {
              currentSection = "Focus Areas";
            } else if (line.startsWith("Inclusion Criteria:")) {
              currentSection = "Inclusion Criteria";
            } else if (line.startsWith("Exclusion Criteria:")) {
              currentSection = "Exclusion Criteria";
            } else if (line.startsWith("Accuracy Requirements:")) {
              parsedInfo["Accuracy Requirements"] = line.replace("Accuracy Requirements:", "").trim();
              currentSection = null;
            } else if (line.trim().startsWith("- ") && currentSection) {
              parsedInfo[currentSection].push(line.trim().substring(2));
            }
          });

          // Update the indicator information
          indicatorInfoToUse[indicator] = parsedInfo;
        } else {
          // If it's not a string, just use it as is (it might already be structured data)
          indicatorInfoToUse[indicator] = customText;
        }
      });
    }

    const response = await fetch(
      "https://llmfoundry.straive.com/gemini/v1beta/models/gemini-1.5-flash-latest:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}:rating-critical-data`,
        },
        credentials: "include",
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `You are an ESG analysis expert. Provide detailed, evidence-based analysis in JSON format.
Guidelines:-  ${JSON.stringify(indicatorInfoToUse)} \n REFER TO THE GUIDELINES FOR EACH INDICATOR \n
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
            "description": "**Direct quotes with Page Number** that provide evidence for the indicator's presence."
          },
          "comments": {
            "type": "string",
            "description": "Additional context or analysis regarding the indicator. Give references from the guidelines provided."
          },
          "conclusion": {
            "type": "string",
            "description": "The conclusion regarding the indicator's involvement, with options from ${JSON.stringify(
              indicators
            )} for each indicator, 'No Value' if not involved."
          }
        },
        "required": ["indicator", "present", "confidence", "evidence", "comments", "conclusion"]
      }
    }
  }
}

Return ONLY valid JSON that matches this schema exactly. Do not include any other text or explanation.
`,
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
        .replace(/```json\n?|\n?```/g, "")
        .replace(/^["']|["']$/g, "")
        .trim();

      // Parse the cleaned JSON response
      const llmResponse = JSON.parse(responseText);
      llmResponseArray = llmResponse.results;
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

  // Only show UI elements if we have valid results
  if (results && results.length > 0 && results.some((result) => result && Object.keys(result).length > 0)) {
    $dropdown.classList.remove("d-none");
    $indicatorInfoCard.classList.remove("d-none");
  } else {
    $dropdown.classList.add("d-none");
    $indicatorInfoCard.classList.add("d-none");
  }

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

      // Add click event listener to update dropdowns
      const button = card.querySelector(".accordion-button");
      button.addEventListener("click", () => {
        // Update indicator dropdown
        indicatorSelect.value = result.indicator;
        // Update value dropdown and select the conclusion
        updateValueDropdown();
        valueSelect.value = result.conclusion;

        // Also update the indicator information in the collapsible card
        updateIndicatorInfo(result.indicator);
      });

      elements.results.appendChild(card);
      $goldenSetDiv.classList.remove("d-none");
    }
  });
}

function resetUI() {
  // Reset the results
  document.getElementById("results").innerHTML = "";
  document.getElementById("goldenSetResults").innerHTML = "";

  // Reset file inputs
  document.getElementById("csvUpload").value = "";

  // Reset dropdown visibility
  $dropdown.classList.add("d-none");
  $indicatorInfoCard.classList.add("d-none");

  // Reset the golden set div visibility
  document.getElementById("goldenSetDiv").classList.add("d-none");

  // Clear any error messages
  document.getElementById("errorAlert").classList.add("d-none");
  document.getElementById("errorAlert").textContent = "";

  // Reset analysis data
  analysis = null;
}

elements.analyzeBtn.addEventListener("click", async () => {
  resetUI(); // Reset UI before starting new analysis
  elements.errorAlert.classList.add("d-none");
  elements.loadingSpinner.classList.remove("d-none");

  try {
    let textWithPages;
    if (elements.urlInput.value) {
      const response = await fetch(
        `https://llmfoundry.straive.com/-/markdown?n=0&url=${encodeURIComponent(elements.urlInput.value)}`
      );
      const text = await response.text();
      textWithPages = [{ page: 1, text }];
    } else if (elements.fileInput.files[0]) {
      pdfName = elements.fileInput.files[0].name;
      textWithPages = await extractText(elements.fileInput.files[0]);
    } else {
      throw new Error("Please provide a URL or upload a PDF file");
    }

    // Store the original text with pages for future re-analysis
    analysis = textWithPages;

    // Analyze the document
    const results = await analyzeDocument(textWithPages);
    displayResults(results);
  } catch (error) {
    console.error("Error : ", error);
    elements.errorAlert.textContent = error.message;
    elements.errorAlert.classList.remove("d-none");
  } finally {
    elements.loadingSpinner.classList.add("d-none");
  }
});

elements.fileInput.addEventListener("change", async (e) => {
  // Don't automatically analyze on file change, just reset the UI
  resetUI();
  elements.errorAlert.classList.add("d-none");
});

$csvUpload.addEventListener("change", (e) => {
  
  $resultsDiv.innerHTML = `<div class="spinner-border text-primary" role="status">
</div>`;
  const file = e.target.files[0];
  // Add validation to check if file exists
  if (!file) {
    console.error("No file selected");
    return;
  }

  // Check file type and process accordingly
  if (file.type === "text/csv" || file.name.endsWith(".csv")) {
    // Process CSV file
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target.result;
      processCSVData(text);
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    try {
      reader.readAsText(file);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  } else if (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.name.endsWith(".xlsx")
  ) {
    // Process XLSX file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Look for "sample data" sheet
        const sheetName = workbook.SheetNames.find(
          name => name.toLowerCase() === "sample data" || name.toLowerCase() === "sample"
        );
        
        if (!sheetName) {
          alert("XLSX file must contain a 'sample data' or 'sample' sheet");
          return;
        }
        
        // Get the worksheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process the data similar to CSV
        processXLSXData(jsonData);
      } catch (error) {
        console.error("Error processing XLSX file:", error);
        alert("Error processing XLSX file: " + error.message);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    try {
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  } else {
    alert("Please select a valid CSV or XLSX file");
  }
});

function processCSVData(csvText) {
  // Parse CSV properly handling quoted fields and special characters
  const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field.trim());
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (field || row.length > 0) {
          row.push(field.trim());
          if (row.length > 0) {
            // Only add non-empty rows
            rows.push(row);
          }
          row = [];
          field = "";
        }
      } else {
        field += char;
      }
    }

    // Handle last field and row
    if (field || row.length > 0) {
      row.push(field.trim());
      rows.push(row);
    }

    return rows;
  };

  const rows = parseCSV(csvText);

  const headers = rows[0].map((h) => h.toLowerCase().trim());

  // Find required column indices
  const nameIndex = headers.findIndex((h) => h === "name");
  const dpNameIndex = headers.findIndex((h) => h === "dp name");
  const correctAnswerIndex = headers.findIndex((h) => h === "correct answer");

  if (nameIndex === -1 || dpNameIndex === -1 || correctAnswerIndex === -1) {
    alert("Required columns not found in CSV. Please ensure CSV has 'Name', 'DP Name' and 'Correct Answer' columns.");
    return;
  }

  // Convert to array of objects with required fields
  const csvData = rows
    .slice(1)
    .map((row) => ({
      name: row[nameIndex]?.trim().toLowerCase(),
      dpName: row[dpNameIndex]?.trim().toLowerCase(),
      correctAnswer: row[correctAnswerIndex]?.trim().toLowerCase(),
    }))
    .filter((row) => row.name && row.dpName && row.correctAnswer);

  // Get the current PDF name from the dropdown
  const currentPDF = pdfName.trim().toLowerCase();

  // Filter CSV data for current PDF
  const relevantData = csvData.filter((row) => row.name === currentPDF);

  // Compare with LLM outputs
  const results = compareWithLLMOutput(relevantData);
}

function processXLSXData(jsonData) {
  // Validate required columns
  if (jsonData.length === 0) {
    alert("No data found in the XLSX file");
    return;
  }
  
  // Check for required columns (case-insensitive)
  const firstRow = jsonData[0];
  const headers = Object.keys(firstRow).map(h => h.toLowerCase().trim());
  
  // Find required column indices
  const sourceExtractionColumn = Object.keys(firstRow).find(
    key => key.toLowerCase().trim() === "source_extraction"
  );
  const extractionValueColumn = Object.keys(firstRow).find(
    key => key.toLowerCase().trim() === "extraction_value"
  );
  const extractionColumn = Object.keys(firstRow).find(
    key => key.toLowerCase().trim() === "extraction"
  );

  const dpIdColumn = Object.keys(firstRow).find(
    key => key.toLowerCase().trim() === "dp_id"
  );

  // Check for required columns
  if (!sourceExtractionColumn || !extractionValueColumn || !dpIdColumn) {
    alert("Required columns not found in XLSX. Please ensure the file has 'source_extraction', 'extraction_value', and 'dp_id' columns.");
    return;
  }

  // Helper function to extract PDF name from URL
  const extractPdfNameFromUrl = (url) => {
    if (!url) return "";
    // Extract the part after the last '/'
    const parts = url.split('/');
    // Replace % with spaces and decode URL
    return decodeURIComponent(parts[parts.length - 1]).replace(/%/g, ' ').trim().toLowerCase();
  };

  // Convert to array of objects with required fields
  const xlsxData = jsonData
    .map((row) => {
      // Extract PDF name from source_extraction URL
      if (!row[sourceExtractionColumn]) {
        return null; // Skip rows without a valid source_extraction
      }
      
      const pdfName = extractPdfNameFromUrl(row[sourceExtractionColumn]);
      // Check if extraction column exists and has one of the required values
      const extractionValue = row[extractionColumn]?.toString().trim().toLowerCase();
      const isValidExtraction = extractionColumn && 
        ["correct", "matched-value", "matched-no value"].includes(extractionValue);
      
      if (!isValidExtraction) {
        return null; // Skip rows with invalid extraction values
      }
      
      // Get the DP ID from the row
      const dpId = row[dpIdColumn] ? parseInt(row[dpIdColumn], 10) : null;
      if (!dpId) {
        return null; // Skip rows without a valid DP ID
      }
      
      return {
        name: pdfName,
        correctAnswer: row[extractionValueColumn]?.toString().trim(),
        dpId: dpId,
        extraction: extractionValue
      };
    })
    .filter((row) => row && row.name && row.correctAnswer && row.dpId);

  // Get the current PDF name from the dropdown
  const currentPDF = pdfName.trim().toLowerCase();

  // Filter data for current PDF
  const relevantData = xlsxData.filter((row) => row.name === currentPDF);

  if (relevantData.length === 0) {
    alert(`No matching data found for the current PDF: ${currentPDF}`);
    return;
  }

  // Compare with LLM outputs
  const results = compareWithLLMOutput(relevantData);

}

function compareWithLLMOutput(excelData) {
  if (!llmResponseArray || llmResponseArray.length === 0) {
    alert("No analysis results available. Please analyze a document first.");
    return;
  }
  
  const matches = [];
  let correctCount = 0;
  let totalComparisons = 0;
  
  // Helper function to normalize strings
  const normalizeString = str => str?.toLowerCase().trim().replace(/\s+/g, " ") || "";

  // Create maps for quick lookups
  const processedIndicators = new Set();
  const indicatorMap = {};
  
  // Build indicator ID mapping
  Object.entries(indicators).forEach(([name, data]) => {
    indicatorMap[data.id] = name;
  });

  // Process Excel data rows
  excelData.forEach(row => {
    const indicatorName = indicatorMap[row.dpId];
    if (!indicatorName) {
      console.warn(`No indicator found for DP ID: ${row.dpId}`);
      return;
    }

    processedIndicators.add(indicatorName);
    totalComparisons++;
    
    const analysisEntry = llmResponseArray.find(item => item.indicator === indicatorName);
    const isCorrect = normalizeString(analysisEntry?.conclusion) === normalizeString(row.correctAnswer);
    
    if (isCorrect) correctCount++;

    matches.push({
      indicator: indicatorName,
      dpId: row.dpId,
      llmOutput: analysisEntry?.conclusion || "N/A",
      csvOutput: row.correctAnswer || "N/A",
      extraction: row.extraction,
      isCorrect
    });
  });

  // Add missing indicators
  Object.entries(indicators).forEach(([name, data]) => {
    if (!processedIndicators.has(name)) {
      totalComparisons++;
      correctCount++; // Mark as correct per requirement
      
      const analysisEntry = llmResponseArray.find(item => item.indicator === name);
      matches.push({
        indicator: name,
        dpId: data.id,
        llmOutput: analysisEntry?.conclusion || "N/A",
        csvOutput: "Not present in golden set",
        extraction: "N/A",
        isCorrect: true
      });
    }
  });

  // Calculate accuracy
  const accuracy = totalComparisons > 0 ? (correctCount / totalComparisons) * 100 : 0;

  // Build results HTML
  let html = `
    <div class="card">
      <div class="card-body">
        <h4 class="card-title ${accuracy >= 80 ? "text-success" : accuracy >= 40 ? "text-warning" : "text-danger"}">
          Accuracy: ${accuracy.toFixed(2)}%
        </h4>
        <p class="card-text">Correct matches: ${correctCount}/${totalComparisons}</p>
        <div class="table-responsive mt-3">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Indicator</th>
                <th>DP ID</th>
                <th>LLM Conclusion</th>
                <th>Golden Set Answer</th>
                <th>Match Status</th>
              </tr>
            </thead>
            <tbody>
  `;

  // Add table rows
  matches.forEach(match => {
    html += `
      <tr>
        <td>${match.indicator}</td>
        <td>${match.dpId}</td>
        <td>${match.llmOutput}</td>
        <td>${match.csvOutput}</td>
        <td class="${match.isCorrect ? "text-success" : "text-danger"}">
          ${match.isCorrect ? "✓ Correct" : "✗ Incorrect"}
        </td>
      </tr>
    `;
  });

  html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  $resultsDiv.innerHTML = html;

  return {
    matches,
    accuracy,
    correctCount,
    total: totalComparisons
  };
}
