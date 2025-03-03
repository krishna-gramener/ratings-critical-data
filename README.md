# Ratings Critical Data

## Overview
Ratings Critical Data is a web-based application designed to extract and analyze Environmental, Social, and Governance (ESG) data points from PDF documents. The tool automates the process of identifying key indicators, evidence, and conclusions based on predefined data points, enabling users to efficiently evaluate sustainability and governance metrics across various industries.

## Description
This application allows users to upload PDF documents or provide URLs to PDFs containing ESG-related information. The system processes these documents using natural language processing techniques to extract relevant data points, determine their presence or absence, and provide supporting evidence from the document. The extracted information is presented in a structured format that highlights key findings, making it easier for analysts and decision-makers to assess ESG performance.

## Features
- **Dual Input Methods**: Upload PDF files directly or provide URLs to PDF documents
- **Automated Analysis**: Extract predefined ESG indicators from document text
- **Evidence Extraction**: Identify and display supporting text from the source document
- **Presence Indicators**: Clear visual indicators showing whether data points are present or absent
- **Page References**: Citations to specific pages where evidence was found
- **Conclusion Generation**: Automated conclusions based on extracted evidence
- **Dark/Light Mode**: Toggle between dark and light themes for comfortable viewing
- **Golden Set Comparison**: Upload CSV files to compare extraction results with ground truth data
- **Accuracy Metrics**: Calculates and displays accuracy metrics for comparison with other tools

## Project Structure
```
RatingsCriticalData/
├── index.html          # Main HTML file with UI structure
├── static/
│   └── script.js       # JavaScript module with application logic
├── .gitignore          # Git ignore file for excluding files from version control
├── README.md           # Project documentation (this file)
```

## Libraries and Technologies Used
- **PDF.js**: Mozilla's PDF rendering library for extracting text from PDF documents
- **Bootstrap 5**: Frontend framework for responsive design and UI components
- **Bootstrap Icons**: Icon library for visual elements
- **Gramex UI**: Utilities including dark theme support
- **ES Modules**: Modern JavaScript module system for code organization
- **LLM API**: Integration with language model API for text analysis (via LLM Foundry)

## Implementation Details
The application follows a modular architecture with these key components:

1. **Document Processing**: 
   - PDF text extraction using PDF.js
   - Text preprocessing to maintain page references

2. **Data Analysis**:
   - API integration with LLM Foundry for text analysis
   - Structured parsing of analysis results

3. **User Interface**:
   - Interactive components for document upload and analysis
   - Accordion-based results display
   - Theme switching functionality

4. **Validation System**:
   - CSV parsing for golden set data
   - Comparison logic for accuracy assessment
   - Metrics calculation and visualization

## Notes for Developers
- **API Authentication**: The application requires a valid token from LLM Foundry. Ensure proper authentication is configured.
- **Indicator Configuration**: The `indicators` object in script.js defines all supported data points and their possible values. Modify this object to add or update indicators.
- **Error Handling**: The application includes comprehensive error handling for file operations and API requests. Maintain this pattern when adding new features.
- **Responsive Design**: UI components are designed to work across device sizes. Test any UI changes on multiple screen dimensions.
- **Performance Considerations**: Large PDF files may require significant processing time. Consider implementing pagination or chunking for very large documents.
- **Future Enhancements**:
  - Consider adding support for additional document formats (DOCX, HTML)
  - Implement caching for previously analyzed documents
  - Add export functionality for analysis results
  - Develop customizable indicator templates for different industries

## Getting Started
1. Clone the repository
2. Open index.html in a modern web browser
3. Upload a PDF or provide a URL to a PDF document
4. Click "Analyze Document" to process the file
5. Review the extracted indicators and evidence in the results section

## License
Copyright 2025 Gramener. All rights reserved.
