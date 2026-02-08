const text = `This information is not available in the provided documents. The documents provided only contain information for the Financial Year 2022-23, and do not mention the budget for the year 2021-2022.
As per the IT_Budget_Statement_2022-23.md, Section 1: Overview, it is mentioned that "This document provides the official IT budget allocation and expenditure details for the Department of Information Technology for the Financial Year 2022-23 (April 2022 to March 2023)."
(IT_Budget_Statement_2022-23.md, Section 1: Overview). There is no mention of the budget for the year 2021-2022 in this document or any other provided document.
Therefore, I must state that the information regarding the budget for the year 2021-2022 is not available in the provided documents.`;

// The regex currently in the file
const regex = /(?:\[|【|\()([\w\-. ]+\.\w+)(?:,\s*([^\]】)]+))?(?:\]|】|\))/g;

console.log("Testing text length:", text.length);

let match;
const citations = [];
while ((match = regex.exec(text)) !== null) {
  console.log("Match found!", match[0]);
  console.log("Source:", match[1]);
  console.log("Section:", match[2]);
  citations.push(match[0]);
}

if (citations.length === 0) {
  console.log("No matches found.");
} else {
  console.log("Total matches:", citations.length);
}
