// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import debounce from 'lodash/debounce';
import Editor from '../components/Editor';
import Content from '../components/Content';

type Props = {
  executeQuery: (query: string) => void,
  tableColumns: Array<TableColumnType>
};

type State = {
  queryHeight: number,
  queryResultsHeight: number,
  query: string,
  rows: Array<Object>
};

export default class QueryPage extends Component<Props, State> {
  state = {
    queryHeight: (window.innerHeight - 40) / 2,
    queryResultsHeight: (window.innerHeight - 40) / 2 - 40,
    query: 'SELECT * FROM sqlite_master',
    rows: []
  };

  item = null;

  didMount: boolean = false;

  async onInputChange(query: string, self: QueryView) {
    if (!self || !self.didMount) {
      return;
    }

    this.setState({ query });

    try {
      const queryResults = await this.props.executeQuery(this.state.query);
      const rows = queryResults[0].rows.map((value, index) => ({
        rowID: value[Object.keys(value)[index]],
        value: Object.values(value).filter(e => !(e instanceof Buffer))
      }));
      this.setState({
        rows
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  getTableData = (result: queryResponseType) => {
    const tableHeaders = result.fields.map(e => e.name);
    const tableData = result.rows.map(e => {
      const tableRow = {};
      tableHeaders.forEach(header => {
        tableRow[header] = e[header];
      });
      return tableRow;
    });
    return tableData;
  };

  onQueryResize = (event, { size }) => {
    this.setState({
      queryHeight: size.height,
      queryResultsHeight: this.item.offsetHeight - size.height
    });
  };

  componentDidMount() {
    this.didMount = true;
    this.item = document.querySelector('.QueryPage').parentElement;
    window.onresizeFunctions['query-page-resize'] = () => {
      if (this.didMount) {
        this.setState({
          queryResultsHeight: this.item.offsetHeight - this.state.queryHeight
        });
      }
    };
    this.onInputChange(this.state.query, this);
  }

  componentWillUnmount() {
    this.didMount = false;
  }

  render() {
    return (
      <div className="QueryPage">
        <ResizableBox
          width={10}
          height={this.state.queryHeight}
          axis="y"
          handleSize={[100, 100]}
          style={{ height: `${this.state.queryHeight}px` }}
          onResize={this.onQueryResize}
        >
          <Editor
            sql={this.state.query}
            onChange={debounce(e => this.onInputChange(e, this), 500)}
          />
        </ResizableBox>
        <div style={{ height: this.state.queryResultsHeight }}>
          <Content
            table={{
              databaseName: '',
              name: '',
              columns: this.props.tableColumns,
              rows: this.state.rows
            }}
          />
        </div>
      </div>
    );
  }
}
