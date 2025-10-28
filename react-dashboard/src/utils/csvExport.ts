import { VulnRow } from "../types";

export const exportToCSV = (
  data: VulnRow[],
  filename: string = "vulnerabilities.csv"
) => {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const headers = [
    "CVE",
    "Severity",
    "Kai Status",
    "Risk Level",
    "CVSS Score",
    "Package Name",
    "Package Version",
    "Image Name",
    "Image Version",
    "Description",
    "Published Date",
    "Discovered Date",
    "Last Modified",
    "Risk Factors",
    "Tags",
    "Group",
    "Repository",
    "Image ID",
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((vuln) =>
      [
        `"${vuln.cve || ""}"`,
        `"${vuln.severity || ""}"`,
        `"${vuln.kaiStatus || ""}"`,
        vuln.cvss || "",
        `"${vuln.packageName || ""}"`,
        `"${vuln.packageVersion || ""}"`,
        `"${vuln.imageName || ""}"`,
        `"${vuln.imageVersion || ""}"`,
        // Escape quotes in description by doubling them (CSV standard)
        `"${(vuln.description || "").replace(/"/g, '""')}"`,
        vuln.publishedAt
          ? new Date(vuln.publishedAt).toISOString().split("T")[0]
          : "",
        vuln.discoveredAt
          ? new Date(vuln.discoveredAt).toISOString().split("T")[0]
          : "",
        // Join risk factors with semicolon for readability
        `"${(vuln.riskFactors || []).join("; ")}"`,
        `"${vuln.group || ""}"`,
        `"${vuln.repo || ""}"`,
        `"${vuln.imageId || ""}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  // Trigger download using browser's download API
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const formatDateForCSV = (timestamp: number): string => {
  return new Date(timestamp).toISOString().split("T")[0];
};
