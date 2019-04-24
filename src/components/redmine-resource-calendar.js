import React, { Component } from 'react'
import PropTypes from 'prop-types'

/**
 * redmine-resource-calendar
 *
 * @author yano3@alhino.jp
 * @see    https://github.com/yano3nora/redmine-resource-calendar
 */
export default class RedmineResourceCalendar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      year: moment().year(),
      month: moment().month() + 1,
      weeks: [],
    }
    this.setWeeks       = this.setWeeks.bind(this)
    this.yearSelectRef  = React.createRef()
    this.monthSelectRef = React.createRef()
  }

  componentDidMount () {
    this.setWeeks()
  }

  componentDidUpdate () {
    console.log(this.state)  // Debug.
  }

  setWeeks () {
    const newWeeks           = []
    const selectedYear       = this.yearSelectRef.current.value
    const selectedMonth      = this.monthSelectRef.current.value
    const firstDayOfMonth    = moment(`${selectedYear}-${selectedMonth}-01`, 'YYYY-MM-DD')
    const firstDayOfCalendar = firstDayOfMonth.add(-firstDayOfMonth.day(), 'days')
    for (let i = 0; i < 6; i++) {
      let adding = 7 * i
      let start  = moment(firstDayOfCalendar.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(adding, 'days')
      newWeeks.push({
        no: start.week(),
        start: start,
        end: moment(start.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(6, 'days'),
        issues: [],
      })
    }
    ;(async () => {
      for (let week of newWeeks) {
        for (let user of this.props.users) {
          await this.fetchIssuesIntoWeek(week, user.id)
        }
      }
      this.setState((prevState, props) => {
        return {
          weeks: newWeeks,
          year:  selectedYear,
          month: selectedMonth,
        }
      })
    })()
  }

  fetchIssuesIntoWeek (week, userId) {
    const query = `key=${this.props.apiKey}`
                  + `&status_id!=closed`
                  + `&start_date=<=${week.end.format('YYYY-MM-DD')}`
                  + `&assigned_to_id=${userId}`
                  + `&due_date=>=${week.start.format('YYYY-MM-DD')}`
                  + `&limit=100`
    return fetch(`${this.props.url}/issues.json?${query}`).then((response) => response.json())
      .then((json) => {
        json.issues.forEach((issue) => {
          const issueStartDate     = moment(issue.start_date, 'YYYY-MM-DD')
          const issueDueDate       = moment(issue.due_date, 'YYYY-MM-DD')
          const dateDiffOfThisWeek = issueDueDate.diff(week.start, 'days')
          let remainingWorkingDays = dateDiffOfThisWeek
          if (issueStartDate.diff(week.start, 'days') === 0 || (issueStartDate.isAfter(week.start) && issueStartDate.isBefore(week.end))) {
            remainingWorkingDays = issueDueDate.diff(issueStartDate, 'days') + 1
          }
          if (remainingWorkingDays >= 7) {
            remainingWorkingDays = remainingWorkingDays - (Math.floor(remainingWorkingDays / 7) * 2)
          }
          let estimatedHours = issue.estimated_hours || null
          if (!estimatedHours) {
            estimatedHours = this.props.workload * remainingWorkingDays
          }
          let issueDateNumber = issueDueDate.diff(issueStartDate, 'days') + 1
          if (issueDateNumber >= 7) {
            issueDateNumber = issueDateNumber - (Math.floor(issueDateNumber / 7) * 2)
          }
          let workloadPerWorkingDays = estimatedHours /  issueDateNumber
          let workloadPerThisWeek    = workloadPerWorkingDays * 5
          if (issueDueDate.isBefore(week.end)) {
            workloadPerThisWeek = workloadPerWorkingDays * remainingWorkingDays
          }
          issue.workload = Math.round(workloadPerThisWeek * 10) / 10
          issue.remaining_working_days    = remainingWorkingDays
          issue.workload_per_working_days = workloadPerWorkingDays
        })
        week.issues.push({
          user: userId,
          tickets: json.issues,
        })
      })
      .catch((error) => {
        alert(error.message)
        console.error(error)
      })
  }

  // Render method on mount.
  render () {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    return (
      <div className="redmine-resource-calendar__content">
        <div className="redmine-resource-calendar__content__form">
          {(() => {
            return (
              <select ref={this.yearSelectRef} defaultValue={this.state.year}>
                <option value={this.state.year + 1}>{this.state.year + 1}</option>
                <option value={this.state.year}>{this.state.year}</option>
                <option value={this.state.year - 1}>{this.state.year - 1}</option>
              </select>
            )
          })()}
          <select ref={this.monthSelectRef} defaultValue={this.state.month}>
            {months.map((month) => <option key={month} value={month}>{month}</option>)}
          </select>
          <button onClick={this.setWeeks}>Reload</button>
        </div>
        <hr />
        <table className="redmine-resource-calendar__content__table">
          <thead>
            <tr>
              <th>weeks</th>
              {this.props.users.map((user) => <th key={user.id}>{user.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {this.state.weeks.map((week) => {
              return (
                <tr key={week.no}>
                  <td>
                    {week.start.format('M/D')}
                    -
                    {week.end.format('D')}
                  </td>
                  {week.issues.map((issue) => {
                    return (
                      <td key={issue.user}>
                        {
                          Math.round((issue.tickets.reduce((a, b) => a + b.workload, 0)) / (this.props.workload * 5) * 100)
                        }
                        %&nbsp;
                        <small>
                          {issue.tickets.reduce((a, b) => a + b.workload, 0)}
                          /
                          {this.props.workload * 5} h
                        </small>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
}

// PropTypes validation.
RedmineResourceCalendar.propTypes = {
  users:    PropTypes.arrayOf(PropTypes.object).isRequired,
  url:      PropTypes.string.isRequired,
  apiKey:   PropTypes.string.isRequired,
  workload: PropTypes.number.isRequired,
}

// Render this.
const element = document.getElementById('redmine-resource-calendar')
ReactDOM.render(
  <RedmineResourceCalendar
    users={JSON.parse(element.dataset.users)}
    url={element.dataset.url}
    apiKey={element.dataset.apiKey}
    workload={Number(element.dataset.workload)}
  />,
  element
)
