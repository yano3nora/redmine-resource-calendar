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
    setTimeout(() => {
      this.setWeeks()
    }, 100)
  }

  componentDidUpdate () {
    console.log(this.state)  // Debug.
  }

  setWeeks () {
    const newWeeks           = []
    const selectedYear       = this.yearSelectRef.current && this.yearSelectRef.current.value
    const selectedMonth      = this.monthSelectRef.current && this.monthSelectRef.current.value
    const firstDayOfMonth    = moment(`${selectedYear}-${selectedMonth}-01`, 'YYYY-MM-DD')
    const firstDayOfCalendar = firstDayOfMonth.add(-firstDayOfMonth.day(), 'days')
    if (!selectedYear || !selectedMonth) {
      return false
    }
    for (let i = 0; i < 6; i++) {
      let adding = 7 * i
      let start  = moment(firstDayOfCalendar.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(adding, 'days')
      newWeeks.push({
        no: start.week(),
        start: start,
        end: moment(start.format('YYYY-MM-DD'), 'YYYY-MM-DD').add(6, 'days'),
        users: [],
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
    const queryForIssues = `key=${this.props.apiKey}`
                          + `&start_date=<=${week.end.format('YYYY-MM-DD')}`
                          + `&assigned_to_id=${userId}`
                          + `&due_date=>=${week.start.format('YYYY-MM-DD')}`
                          + `&status_id=*`
                          + `&limit=100`
    const queryForSpents = `key=${this.props.apiKey}`
                          + `&from=${week.start.format('YYYY-MM-DD')}`
                          + `&to=${week.end.format('YYYY-MM-DD')}`
                          + `&user_id=${userId}`
                          + `&limit=100`
    return fetch(`${this.props.url}/issues.json?${queryForIssues}`)
      .then((response) => response.json())
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
        })
        week.users.push({
          userId: userId,
          issues: json.issues,
          spents: [],
          tickets: [],
        })
      })
      .then(() => fetch(`${this.props.url}/time_entries.json?${queryForSpents}`))
      .then((response) => response.json())
      .then((json) => {
        for (let i = 0; i < week.users.length; i++) {
          if (week.users[i].userId !== userId) continue
          week.users[i].spents.push(...json.time_entries)
        }
      })
      .then(() => {
        for (let j = 0; j < week.users.length; j++) {
          week.users[j].issues.forEach((issue) => {
            if (!week.users[j].tickets.includes(issue.id)) {
              week.users[j].tickets.push(issue.id)
            }
          })
          week.users[j].spents.forEach((spent) => {
            if (!week.users[j].tickets.includes(spent.issue.id)) {
              week.users[j].tickets.push(spent.issue.id)
            }
          })
        }
      })
      .catch((error) => {
        console.error(error)
      })
  }

  // Render method on mount.
  render () {
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    return (
      <div className="redmine-resource-calendar__content">
        <div className="redmine-resource-calendar-form">
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
        <table className="redmine-resource-calendar-table">
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
                  <td className="redmine-resource-calendar-week-field">
                    {week.start.format('M/D')}
                    -
                    {week.end.format('D')}
                  </td>
                  {week.users.map((user) => {
                    return (
                      <td key={user.userId}>
                        <div className="redmine-resource-calendar-user-field">
                          <div className="redmine-resource-calendar-resources">
                            <div className="redmine-resource-calendar-plans">
                              <span className="redmine-resource-calendar-percent">
                                {
                                  Math.round((user.issues.reduce((a, b) => a + b.workload, 0)) / (this.props.workload * 5) * 100)
                                }
                              </span>
                              <small className="redmine-resource-calendar-hours">
                                {Math.round(user.issues.reduce((a, b) => a + b.workload, 0) * 10) / 10}
                                /
                                {this.props.workload * 5}
                              </small>
                            </div>
                            <div className="redmine-resource-calendar-acts">
                              <span className="redmine-resource-calendar-percent">
                                {
                                  Math.round((user.spents.reduce((a, b) => a + b.hours, 0)) / (this.props.workload * 5) * 100)
                                }
                              </span>
                              <small className="redmine-resource-calendar-hours">
                                {Math.round(user.spents.reduce((a, b) => a + b.hours, 0) * 10) / 10}
                                /
                                {this.props.workload * 5}
                              </small>
                            </div>
                          </div>
                          <div className="redmine-resource-calendar-tickets">
                            {user.tickets.map((ticket) => <a key={ticket} target="_blank" href={`${this.props.url}/issues/${ticket}`}>#{ticket}<br /></a>)}
                          </div>
                        </div>
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
