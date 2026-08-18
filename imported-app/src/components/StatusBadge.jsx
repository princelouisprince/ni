function StatusBadge({ status }) {
  const statusConfig = {
    new:                     { bg: '#dbeafe', text: '#1e40af', label: 'New',                  dot: false },
    confirmed:               { bg: '#d1fae5', text: '#065f46', label: 'Confirmed',             dot: false },
    assigned_to_carpenter:   { bg: '#fef3c7', text: '#92400e', label: 'Assigned',             dot: false },
    in_production:           { bg: '#ede9fe', text: '#5b21b6', label: 'In Production',        dot: false },
    ready_for_finishing:     { bg: '#e0e7ff', text: '#3730a3', label: 'Ready for Finishing',  dot: false },
    finishing:               { bg: '#fce7f3', text: '#9d174d', label: 'Finishing',            dot: false },
    ready_for_delivery:      { bg: '#d1fae5', text: '#065f46', label: 'Ready for Delivery',  dot: true  },
    delivered:               { bg: '#d1fae5', text: '#065f46', label: 'Delivered',            dot: true  },
    completed_production:    { bg: '#d1fae5', text: '#065f46', label: 'Completed',            dot: true  },
    archived:                { bg: '#f3f4f6', text: '#374151', label: 'Archived',             dot: false },
  };

  const config = statusConfig[status] || { bg: '#f3f4f6', text: '#374151', label: status, dot: false };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 500,
        background: config.bg,
        color: config.text,
        whiteSpace: 'nowrap',
      }}
    >
      {config.dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: config.text,
            flexShrink: 0,
          }}
        />
      )}
      {config.label}
    </span>
  );
}

export default StatusBadge;
