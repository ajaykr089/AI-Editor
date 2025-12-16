type Props = {
  problems: { message: string }[];
};

const ProblemsPanel = ({ problems }: Props) => {
  if (!problems.length) return null;
  return (
    <div className="problems-panel">
      <div className="panel-title">Problems</div>
      <ul>
        {problems.map((p, idx) => (
          <li key={idx}>{p.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProblemsPanel;

