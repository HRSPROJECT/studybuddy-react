import React from 'react';
import './SummaryTable.css';

interface SummaryTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  title?: string;
}

const SummaryTable: React.FC<SummaryTableProps> = ({ headers, rows, title }) => {
  return (
    <div className="summary-table-container">
      {title && <h3 className="summary-table-title">{title}</h3>}
      <div className="summary-table-wrapper">
        <table className="summary-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SummaryTable;
