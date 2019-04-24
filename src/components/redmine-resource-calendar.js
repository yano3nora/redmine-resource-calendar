import React, { Component } from 'react'
import PropTypes from 'prop-types'

/**
 * redmine-resource-calendar
 *
 * @author yano3@alhino.jp
 * @see    https://github.com/yano3nora/redmine-resource-calendar
 */
export default class RedmineResourceCalendar extends Component {
  // Initialize.
  constructor (props) {
    super(props)
    this.state = {
      year: moment().year(),
      month: moment().month() + 1,
      users: this.props.users,
      weeks: [],
      tickets: [],
    }
    this.reload         = this.reload.bind(this)
    this.yearSelectRef  = React.createRef()
    this.monthSelectRef = React.createRef()
  }

  reload () {
    const selectedYear  = this.yearSelectRef.current.value
    const selectedMonth = this.monthSelectRef.current.value
    this.setState((prevState, props) => {
    })
  }

  // Life cycle events.
  componentDidMount () {
    // コンポーネントのマウント直後イベント
    // Ajax など非同期処理で初期データを state に突っ込む用
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
          <button onClick={this.reload}>Reload</button>
        </div>
        <table className="redmine-resource-calendar__content__table">
          <thead></thead>
          <tbody>
            {this.state.weeks.map((week) => {
              return (
                <tr key={week}>
                  
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
  users:    PropTypes.arrayOf(PropTypes.string).isRequired,
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
