// @flow
import React from 'react';

export type SpecialType = 'null' | undefined;

type Props = {
  type: string | number | boolean | null,
  value: string | number | boolean | null
};

/**
 * Used to render a cell in react-table for special types (e.g. NULL)
 */
export default function StructurePageCell(props: Props) {
  const { type, value } = props;

  switch (type) {
    case null:
      return (
        <div>
          <input
            className="Structure-Cell-Input--null"
            value={undefined}
            placeholder={value === null ? 'NULL' : value}
          />
        </div>
      );
    default:
      return (
        <div>
          <input
            className="Structure-Cell-Input"
            value={value}
            placeholder={value === null ? 'NULL' : value}
          />
        </div>
      );
  }
}


StructurePageCell.defaultProps = {
  value: ''
};


// these are the only things that are colored
// null, boolean, enum,
