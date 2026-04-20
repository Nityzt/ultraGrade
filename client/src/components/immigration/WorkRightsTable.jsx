import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const WORK_RULES = [
  {
    situation: 'During academic session (full-time)',
    oncampus: 'unlimited',
    offcampus: '24 hrs/week',
    note: 'Off-campus limit applies per week'
  },
  {
    situation: 'During scheduled breaks (reading week, summer)',
    oncampus: 'unlimited',
    offcampus: 'unlimited',
    note: 'Full-time work allowed during official breaks'
  },
  {
    situation: 'Final semester (last term)',
    oncampus: 'unlimited',
    offcampus: '24 hrs/week',
    note: 'Study permit must remain valid'
  },
  {
    situation: 'After graduation (without PGWP)',
    oncampus: 'not allowed',
    offcampus: 'not allowed',
    note: 'Must apply for PGWP before permit expires'
  },
];

const StatusIcon = ({ value }) => {
  if (value === 'unlimited') return <CheckCircle size={16} className="text-success" />;
  if (value === 'not allowed') return <XCircle size={16} className="text-error" />;
  return <AlertCircle size={16} className="text-warning" />;
};

export default function WorkRightsTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-base-300">
      <table className="table table-sm w-full">
        <thead>
          <tr className="bg-base-300 text-xs">
            <th>Situation</th>
            <th>On-Campus</th>
            <th>Off-Campus</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {WORK_RULES.map((row, i) => (
            <tr key={i} className="hover:bg-base-200">
              <td className="font-medium text-sm">{row.situation}</td>
              <td>
                <div className="flex items-center gap-2 text-sm">
                  <StatusIcon value={row.oncampus} />
                  <span className="capitalize">{row.oncampus}</span>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2 text-sm">
                  <StatusIcon value={row.offcampus} />
                  <span className="capitalize">{row.offcampus}</span>
                </div>
              </td>
              <td className="text-xs text-base-content/60">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
