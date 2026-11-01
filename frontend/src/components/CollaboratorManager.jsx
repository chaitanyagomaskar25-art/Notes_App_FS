
import { useEffect, useState } from "react";

function CollaboratorManager({ note, onUpdate }) {
  const [collaboratorId, setCollaboratorId] = useState("");
  const [collaborators, setCollaborators] = useState(
    (note?.collaborators ?? []).map((item) =>
      typeof item === "string" ? item : item._id
    )
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCollaborators(
      (note?.collaborators ?? []).map((item) =>
        typeof item === "string" ? item : item._id
      )
    );
    setCollaboratorId("");
  }, [note]);

  if (!note) return null;

  const addCollaborator = () => {
    const id = collaboratorId.trim();

    if (!id || collaborators.includes(id)) return;

    setCollaborators((current) => [...current, id]);
    setCollaboratorId("");
  };

  const removeCollaborator = (id) => {
    setCollaborators((current) =>
      current.filter((item) => item !== id)
    );
  };

  const saveCollaborators = async () => {
    setSaving(true);

    try {
      await onUpdate(note._id, collaborators);
      alert("Collaborators updated.");
    } catch (error) {
      alert(error.message || "Could not update collaborators.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm flex flex-col gap-3 mt-5">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Collaborators</h3>

      <div className="flex gap-2">
        <input
          value={collaboratorId}
          onChange={(event) => setCollaboratorId(event.target.value)}
          placeholder="Enter collaborator's user ID"
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
        />

        <button
          type="button"
          onClick={addCollaborator}
          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
        >
          Add
        </button>
      </div>

      {collaborators.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No collaborators added.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
          {collaborators.map((id) => (
            <li
              key={id}
              className="flex items-center justify-between gap-2 px-2.5 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <code className="text-xs text-gray-500 dark:text-gray-400 break-all">{id}</code>
              <button
                type="button"
                onClick={() => removeCollaborator(id)}
                className="px-2 py-1 border border-red-200 dark:border-red-700 rounded text-xs font-medium text-red-500 hover:bg-red-50 bg-red-900/30"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={saveCollaborators}
        disabled={saving}
        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save Collaborators"}
      </button>
    </section>
  );
}

export default CollaboratorManager;
