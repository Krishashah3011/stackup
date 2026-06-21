const STATUS_STYLES = {
  Applied: 'badge-applied',
  'OA Scheduled': 'badge-oa',
  'OA Cleared': 'badge-oa',
  'Interview Scheduled': 'badge-interview',
  Selected: 'badge-selected',
  Rejected: 'badge-rejected',
};

const StatusBadge = ({ status }) => {
  const cls = STATUS_STYLES[status] || 'badge-applied';
  return <span className={cls}>{status}</span>;
};

export default StatusBadge;
