function AdminHeader({ onMenuClick }) {
  return (
    <div className="header">

      <h1>
        Admin Panel
      </h1>

      <button
        className="toggle-btn"
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars" />
      </button>

    </div>
  );
}

export default AdminHeader;