// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import type { Children } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
// import Tabs from '../components/Tabs';
import { Switch, Route } from 'react-router';
import ContentPage from './ContentPage';
import StructurePage from './StructurePage';
import QueryPage from './QueryPage';
import GraphPage from './GraphPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { Database, getVersion } from '../api/Database';
import { setDatabasePath } from '../actions/index';
import type { DatabaseType } from '../types/DatabaseType';
import type { TableType } from '../types/TableType';
import { OPEN_FILE_CHANNEL } from '../types/channels';

type Props = {
  children: Children,
  databasePath: ?string,
  setDatabasePath: (string) => null
};

type State = {
  widthSidebar: number, // 200
  widthGrid: number, // window.innerWidth - 200
  databaseName: ?string,
  tables: ?Array<TableType>,
  selectedTable: ?TableType,
  DatabaseApi: Database
  // siderCollapsed: boolean
};

class HomePage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    const DatabaseApi = new Database(props.databasePath);
    this.state = {
      // @TODO: See LoginPage line 131 for why replace'_' with '/'
      widthSidebar: 200,
      widthGrid: window.innerWidth - 200,
      DatabaseApi,
      databaseName: null,
      tables: null,
      // @HACK: HARDCODE
      databaseType: 'SQLite',
      databaseVersion: '',
      selectedTable: null,
    };
    ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
      this.props.setDatabasePath(filePath);
    });
    // ipcRenderer.on(DELETE_TABLE_CHANNEL, () => {
    //   this.deleteSelectedTable();
    // });
  }

  /**
   * Upon mounting, component fetches initial database data and configures
   * grid/sidebar resizing data. Also connects the DatabaseApi
   */
  async componentDidMount() {
    await this.state.DatabaseApi.connect();
    await this.setDatabaseResults(this.props.databasePath);
    const databaseVersion = await getVersion(this.props.databasePath);
    this.setState({
      databaseVersion
    });

    window.onresizeFunctions['sidebar-resize-set-state'] = () => {
      this.setState({
        widthSidebar: this.state.widthSidebar,
        widthGrid: window.innerWidth - this.state.widthSidebar
      });
    };

    const grid = document.querySelector('.HomePage .Grid');
    const sidebar = document.querySelector('.Sidebar');
    const height = 32 + 10 + 21 + 15;
    grid.style.height = `${window.innerHeight - height}px`;
    sidebar.style.height = `${window.innerHeight - height + 40}px`;

    // If the window is resized, change the height of the grid repsectively
    window.onresizeFunctions['resize-grid-resize'] = (() => {
      grid.style.height = `${window.innerHeight - height}px`;
      sidebar.style.height = `${window.innerHeight - height + 40}px`;
    });
  }

  /**
   * Uses the database api to set container's state from falcon-core
   * @TODO: Since supporting just SQLite, getDatabases will only return 1 db
   */
  setDatabaseResults = async (filePath: string) => {
    const databasesArr = await this.state.DatabaseApi.getDatabases();
    const { databaseName, tables } = databasesArr[0];
    this.setState({
      databaseName,
      tables,
      selectedTable:
        this.state.selectedTable || tables[0],
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };


  onResizeGrid = (event, { size }) => {
    this.setState({
      widthGrid: size.width,
      widthSidebar: window.innerWidth - size.width
    });
  };

  onResizeSidebar = (event, { size }) => {
    this.setState({
      widthSidebar: size.width,
      widthGrid: window.innerWidth - size.width
    });
  };

  onSelectTable = (selectedTable: TableType) => {
    this.setState({ selectedTable });
  };

  render() {
    if (!this.state.selectedTable) return <div />;
    return (
      <div className="HomePage container-fluid">
        <div className="row">
          <div className="sticky">
            <Header
              selectedTableName={this.state.selectedTable.tableName}
              databaseType={this.state.databaseType}
              databaseName={this.state.databaseName}
              databaseVersion={this.state.databaseVersion}
            />
            {/**
            <div className="col-sm-12 no-padding">
              <Tabs />
            </div> * */}
            <div className="row no-margin">
              <ResizableBox
                width={this.state.widthSidebar}
                height={100}
                minConstraints={[100, 200]}
                maxConstraints={[400, 400]}
                onResize={this.onResizeSidebar}
                handleSize={[100, 100]}
                axis="x"
              >
                {/* Currently only supports one database file at a time (since using SQLite only) */}
                <Sidebar databaseName={this.state.databaseName} tables={this.state.tables} onSelectTable={this.onSelectTable} selectedTable={this.state.selectedTable} />
              </ResizableBox>
              <div className="Grid" style={{ position: 'relative', width: this.state.widthGrid, overflow: 'scroll' }}>
                <Switch>
                  <Route path="/home/content" render={() => <ContentPage table={this.state.selectedTable} />} />
                  <Route path="/home/structure" render={() => <StructurePage tablePromise={this.state.DatabaseApi.getTableColumns(this.state.selectedTable.tableName)} />} />
                  <Route path="/home/query" component={QueryPage} />
                  <Route path="/home/graph" render={() => <GraphPage databasePath={this.props.databasePath} />} />
                </Switch>
              </div>
              <Footer offset={this.state.widthSidebar} pathname={this.props.location.pathname} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    databasePath: state.databasePath,
  };
}


export default connect(mapStateToProps, { setDatabasePath })(HomePage);
