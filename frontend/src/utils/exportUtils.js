import { jsPDF } from "jspdf";

const slugify = (value) =>
  (value || "note")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "note";

const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadText = (filename, content, mime = "text/plain") => {
  downloadBlob(filename, new Blob([content], { type: mime }));
};

export const exportMarkdown = (note) => {
  const content = `# ${note.title || "Untitled"}\n\n${note.content || ""}`;
  downloadText(`${slugify(note.title)}.md`, content, "text/markdown");
};

export const exportTxt = (note) => {
  const content = `${note.title || "Untitled"}\n\n${note.content || ""}`;
  downloadText(`${slugify(note.title)}.txt`, content, "text/plain");
};

export const exportPdf = (note) => {
  const doc = new jsPDF();
  const title = note.title || "Untitled";
  const content = note.content || "";
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, 180);
  doc.text(lines, 14, 30);
  doc.save(`${slugify(title)}.pdf`);
};

