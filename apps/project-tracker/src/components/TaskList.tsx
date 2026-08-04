import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Task } from "@/types";
import { buttonBase, cn, inputBase } from "@/lib/ui";

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onAdd: (title: string) => void;
}

export function TaskList({ tasks, onToggle, onDelete, onAdd }: TaskListProps) {
  const [title, setTitle] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No tasks yet. Add a few and progress fills in on its own.
        </p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[var(--panel-2)]"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={task.done}
                aria-label={task.title}
                onClick={() => onToggle(task.id)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                  task.done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-[var(--border)] hover:border-emerald-500",
                )}
              >
                {task.done ? <Check size={13} strokeWidth={3} /> : null}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  task.done && "text-[var(--muted)] line-through",
                )}
              >
                {task.title}
              </span>
              <button
                type="button"
                aria-label={`Delete task ${task.title}`}
                onClick={() => onDelete(task.id)}
                className="rounded-md p-1 text-[var(--muted)] opacity-0 transition hover:text-rose-500 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <input
          className={inputBase}
          value={title}
          placeholder="Add a task…"
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim()}
          aria-label="Add task"
          className={cn(buttonBase, "shrink-0 bg-blue-600 px-3 text-white hover:bg-blue-500")}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
