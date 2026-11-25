import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BedDouble,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Users,
  X,
  Filter,
  HeartPulse,
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const emptyForm = {
  name: "",
  age: "",
  gender: "",
  ward: "",
  department: "",
  doctor: "",
  admission_date: new Date().toISOString().slice(0, 10),
  status: "Admitted",
};

export default function App() {
  const [patients, setPatients] = useState([]);
  const [options, setOptions] = useState({
    genders: [],
    wards: [],
    departments: [],
    doctors: [],
  });

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    ward: "",
    department: "",
    doctor: "",
  });

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function request(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.detail
          ? Array.isArray(data.detail)
            ? data.detail.map((x) => x.msg).join(", ")
            : data.detail
          : "Something went wrong."
      );
    }

    return data;
  }

  async function loadPatients() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      setPatients(
        await request(`/api/patients?${params.toString()}`)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    request("/api/options")
      .then(setOptions)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadPatients, 250);
    return () => clearTimeout(timer);
  }, [search, filters]);

  const stats = useMemo(
    () => ({
      total: patients.length,
      admitted: patients.filter((p) => p.status === "Admitted").length,
      discharged: patients.filter((p) => p.status === "Discharged").length,
    }),
    [patients]
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModal(true);
  }

  function openEdit(patient) {
    setEditing(patient.id);
    setForm({ ...patient, age: String(patient.age) });
    setError("");
    setModal(true);
  }

  function change(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function save(e) {
    e.preventDefault();
    setError("");

    const payload = {
      ...form,
      age: Number(form.age),
    };

    try {
      await request(
        editing
          ? `/api/patients/${editing}`
          : "/api/patients",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setModal(false);
      await loadPatients();
    } catch (err) {
      setError(err.message);
    }
  }

  async function discharge(patient) {
    if (!window.confirm(`Mark ${patient.name} as discharged?`)) {
      return;
    }

    try {
      await request(`/api/patients/${patient.id}/discharge`, {
        method: "PATCH",
      });

      await loadPatients();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(patient) {
    if (
      !window.confirm(
        `Delete the record for ${patient.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await request(`/api/patients/${patient.id}`, {
        method: "DELETE",
      });

      await loadPatients();
    } catch (e) {
      setError(e.message);
    }
  }

  const selectField = (label, key, items) => (
    <label>
      {label}
      <select
        required
        value={form[key]}
        onChange={(e) => change(key, e.target.value)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {items.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <HeartPulse size={23} />
          </div>

          <div>
            <b>CareFlow</b>
            <small>HOSPITAL MANAGEMENT</small>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <div className="nav active">
          <Users size={18} />
          Patient Admissions
        </div>

        <div className="sidebar-note">
          <div className="pulse">
            <Activity size={17} />
          </div>
          <b>Patient care,</b>
          <span>organized in one place.</span>
          <small>DScribe</small>
        </div>

        <div className="side-footer">
          Patient Admission Management
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">HOSPITAL / PATIENTS</div>
            <h1>Patient Admissions</h1>
            <p>Manage patient records and admission status.</p>
          </div>

          <button className="primary" onClick={openAdd}>
            <Plus size={18} />
            Add patient
          </button>
        </header>

        {error && !modal && (
          <div className="alert">
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        <section className="stats">
          <div className="stat-card">
            <div className="stat-icon teal">
              <Users size={19} />
            </div>
            <div>
              <span>Total patients</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Activity size={19} />
            </div>
            <div>
              <span>Currently admitted</span>
              <strong>{stats.admitted}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <CheckCircle2 size={19} />
            </div>
            <div>
              <span>Discharged</span>
              <strong>{stats.discharged}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Patient directory</h2>
              <p>Search, filter and manage hospital admissions.</p>
            </div>

            <div className="count-pill">
              {patients.length} records
            </div>
          </div>

          <div className="toolbar">
            <div className="searchbox">
              <Search size={18} />

              <input
                placeholder="Search by patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="filters">
              <Filter size={16} />

              {[
                ["ward", "All wards", options.wards],
                ["department", "All departments", options.departments],
                ["doctor", "All doctors", options.doctors],
              ].map(([key, placeholder, items]) => (
                <select
                  key={key}
                  value={filters[key]}
                  onChange={(e) =>
                    setFilters((current) => ({
                      ...current,
                      [key]: e.target.value,
                    }))
                  }
                >
                  <option value="">{placeholder}</option>

                  {items.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PATIENT</th>
                  <th>AGE / GENDER</th>
                  <th>WARD</th>
                  <th>DEPARTMENT</th>
                  <th>DOCTOR</th>
                  <th>ADMISSION DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="empty">
                      Loading patient records...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">
                      <div className="empty-icon">
                        <BedDouble size={23} />
                      </div>
                      <b>No patients found</b>
                      <span>
                        Add a patient or adjust your search and filters.
                      </span>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>
                        <div className="patient-cell">
                          <div className="avatar">
                            {patient.name
                              .split(" ")
                              .map((x) => x[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <b>{patient.name}</b>
                        </div>
                      </td>

                      <td>
                        {patient.age} yrs · {patient.gender}
                      </td>

                      <td>{patient.ward}</td>
                      <td>{patient.department}</td>
                      <td>{patient.doctor}</td>

                      <td>
                        {new Date(
                          patient.admission_date + "T00:00:00"
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>
                        <span
                          className={`status ${patient.status.toLowerCase()}`}
                        >
                          {patient.status}
                        </span>
                      </td>

                      <td>
                        <div className="actions">
                          <button
                            title="Edit patient"
                            onClick={() => openEdit(patient)}
                          >
                            <Pencil size={16} />
                          </button>

                          {patient.status === "Admitted" && (
                            <button
                              title="Mark discharged"
                              onClick={() => discharge(patient)}
                            >
                              <CheckCircle2 size={16} />
                            </button>
                          )}

                          <button
                            className="danger-icon"
                            title="Delete patient"
                            onClick={() => remove(patient)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="table-foot">
            <span>
              Showing {patients.length} patient record
              {patients.length === 1 ? "" : "s"}
            </span>

            <span>
              <span className="live-dot"></span>
              Connected to patient database
            </span>
          </div>
        </section>

        <footer>
          CareFlow Patient Admissions
        </footer>
      </main>

      {modal && (
        <div
          className="overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setModal(false)
          }
        >
          <div className="modal">
            <div className="modal-head">
              <div>
                <div className="eyebrow">
                  {editing ? "UPDATE RECORD" : "NEW ADMISSION"}
                </div>

                <h2>
                  {editing ? "Edit patient" : "Add new patient"}
                </h2>

                <p>Enter the patient's details below.</p>
              </div>

              <button
                className="close"
                onClick={() => setModal(false)}
              >
                <X />
              </button>
            </div>

            {error && (
              <div className="alert form-alert">{error}</div>
            )}

            <form onSubmit={save}>
              <div className="form-grid">
                <label className="wide">
                  Patient name
                  <input
                    required
                    maxLength="100"
                    pattern="[A-Za-z ]+"
                    title="Use letters and spaces only"
                    placeholder="e.g. Ananya Rao"
                    value={form.name}
                    onChange={(e) => change("name", e.target.value)}
                  />
                </label>

                <label>
                  Age
                  <input
                    required
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Age in years"
                    value={form.age}
                    onChange={(e) => change("age", e.target.value)}
                  />
                </label>

                {selectField("Gender", "gender", options.genders)}
                {selectField("Ward", "ward", options.wards)}
                {selectField("Department", "department", options.departments)}

                <div className="wide">
                  {selectField("Doctor", "doctor", options.doctors)}
                </div>

                <label>
                  Admission date
                  <input
                    required
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.admission_date}
                    onChange={(e) =>
                      change("admission_date", e.target.value)
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => change("status", e.target.value)}
                  >
                    <option>Admitted</option>
                    <option>Discharged</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary">
                  {editing ? "Save changes" : "Add patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}