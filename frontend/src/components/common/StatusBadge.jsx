const STATUS_MAP = {
  'Applied':              'badge-applied',
  'OA Scheduled':         'badge-oa',
  'OA Cleared':           'badge-oa',
  'Interview Scheduled':  'badge-interview',
  'Selected':             'badge-selected',
  'Rejected':             'badge-rejected',
};
const StatusBadge = ({ status }) => (
  <span className={STATUS_MAP[status] || 'badge-applied'}>{status}</span>
);
export default StatusBadge;