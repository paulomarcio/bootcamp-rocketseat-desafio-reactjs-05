import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import {
  Loading,
  Owner,
  IssueList,
  IssueStates,
  IssuesPagination,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    issueStates: ['open', 'closed', 'all'],
    repoState: 'open',
    perPage: 5,
    currentPage: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { repoState, perPage, currentPage } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: repoState,
          per_page: perPage,
          page: currentPage,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  getIssues = async ({ state = 'open', page = 1 }) => {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);
    const { perPage } = this.state;
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state,
        per_page: perPage,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  handleFilter = async state => {
    this.setState({ repoState: state, currentPage: 1 });

    this.getIssues({ state });
  };

  handlePagination = async direction => {
    const { repoState, currentPage } = this.state;
    const page = direction === 'next' ? currentPage + 1 : currentPage - 1;

    this.setState({ currentPage: page });

    this.getIssues({ state: repoState, page });
  };

  render() {
    const {
      repository,
      issues,
      loading,
      issueStates,
      repoState,
      currentPage,
    } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueStates>
          {issueStates.map(state => (
            <li key={state}>
              <button
                className={repoState === state ? 'selected' : ''}
                type="button"
                onClick={() => this.handleFilter(state)}
              >
                {state}
              </button>
            </li>
          ))}
        </IssueStates>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <IssuesPagination>
          <li>
            <button
              disabled={currentPage === 1 ? 1 : 0}
              onClick={() => this.handlePagination('previous')}
              type="button"
            >
              Anterior
            </button>
          </li>
          <li>
            <button
              disabled={currentPage === 2 ? 1 : 0}
              onClick={() => this.handlePagination('next')}
              type="button"
            >
              Próximo
            </button>
          </li>
        </IssuesPagination>
      </Container>
    );
  }
}
