import React, { useState, useEffect, useCallback } from 'react'
import { APP_ROUTES } from '../../router/Route.js'
import { useCookies } from 'react-cookie'
import { useNavigate } from 'react-router-dom'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
//components
import Header from '../Header'
import './index.sass'

// icons
import PersonIcon from '@mui/icons-material/Person'
import Skeleton from '@mui/material/Skeleton'
import './index.sass'
import { Dialog, Pagination } from '@mui/material'
import axios from 'axios'

const INCOME_TYPES = {
  income: 'Поступление',
  outcome: 'Расход',
  rent: 'Аренда',
}

const OWNER = {
  ADMIN: 'Шохрух',
  INVESTOR: 'Инвестор',
  PARTNER: 'Партнер',
}

const Monitoring = (props) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [open, setOpen] = useState(false)
  const [openCreateOutcome, setOpenCreateOutcome] = useState(false)
  const [rents, setRents] = useState([])
  const [sum, setSum] = useState([])
  const [ownersIncome, setOwnersIncome] = useState([])
  const [history, setHistory] = useState([])

  const [page, setPage] = React.useState(1)
  const handleChange = (event, value) => {
    setPage(value)
  }

  const role = localStorage.getItem('@role')
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const fetchData = useCallback(async (url, setter) => {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('@token')}`,
          'ngrok-skip-browser-warning': '69420',
        },
      })
      setter(response.data)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const createIncome = useCallback(async (e) => {
    e.preventDefault()
    const data = {
      owner: e.target.owner.value,
      comment: e.target.comment.value,
      amount: +e.target.amount.value,
      createdAt: new Date(new Date().getTime() + 5 * 60 * 60 * 1000),
    }

    try {
      const response = await axios.post(`${APP_ROUTES.URL}/income`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('@token')}`,
        },
      })
      refreshStates()
      handleClose()
    } catch (error) {
      console.error(error)
    }
  }, [])

  const createOutcome = useCallback(async (e) => {
    e.preventDefault()
    const data = {
      owner: e.target.owner.value,
      comment: e.target.comment.value,
      amount: +e.target.amount.value,
      createdAt: new Date(new Date().getTime() + 5 * 60 * 60 * 1000),
    }

    try {
      const response = await axios.post(`${APP_ROUTES.URL}/outcome`, data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('@token')}`,
        },
      })
      refreshStates()
      handleCloseCreateOutcome()
    } catch (error) {
      console.error(error)
    }
  }, [])

  const refreshStates = useCallback(() => {
    fetchData(
      `${APP_ROUTES.URL}/monitoring/rents?page=` + page + `&limit=30`,
      setRents
    )
    fetchData(
      `${APP_ROUTES.URL}/monitoring/sum?page=` + page + `&limit=30`,
      setSum
    )
    fetchData(
      `${APP_ROUTES.URL}/monitoring/history?page=` + page + `&limit=30`,
      setHistory
    )
    fetchData(
      `${APP_ROUTES.URL}/monitoring/ownersIncome?page=` + page + '&limit=30',
      setOwnersIncome
    )
  }, [page, fetchData])

  const handleClose = () => {
    setOpen(false)
  }

  const handleCloseCreateOutcome = () => {
    setOpenCreateOutcome(false)
  }

  useEffect(() => {
    refreshStates()
  }, [refreshStates])

  const DayStatsInfo = ({ item }) => (
    <div className="dayStatsInfo">
      <div className="dayStatsHeading">
        <h3>{INCOME_TYPES[item.type]}</h3>
        <p>
          {item.comment ||
            (item?.Car && item?.Car?.model + ' ' + item?.Car?.carNumber) ||
            'Нет данных'}
        </p>
      </div>
      <div className="dayStatsPrice">
        <h3>
          {item.type === 'outcome' ? '-' : '+'}
          {item.amount.toLocaleString('de-DE') + ' uzs'}
        </h3>
        <p>
          {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
            hour: 'numeric',
            minute: 'numeric',
            timeZone: 'UTC',
          })}
        </p>
      </div>
    </div>
  )

  const DayStats = ({ item }) => (
    <>
      <div className="dayStats">
        <p>
          {new Date(item.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <p>
          {(item.income - item.outcome + item.rent > 0 ? '+' : '') +
            (item.income - item.outcome + item.rent).toLocaleString('de-DE') +
            ' uzs'}
        </p>
      </div>
      {item.detailed.map((detailedItem, index) => (
        <DayStatsInfo key={index} item={detailedItem} />
      ))}
    </>
  )

  const PartnerItem = ({ title, income, history, type }) => (
    <div className="partnerItem">
      <div className="partnerItemHeading">
        <div className="partnerIcon">
          <h3>{title}</h3>
          <PersonIcon />
        </div>
        {role === 'admin' && (
          <div className="partnerBalance">
            <h3>Баланс:</h3>
            <p>{income?.toLocaleString('de-DE') + ' uzs'}</p>
          </div>
        )}
      </div>
      <div className="partnerItemBody">
        <div className="stats">
          {role === 'admin' && (
            <div className="income">
              <h3>Поступление:</h3>
              <p>
                +
                {history?.total?.[type]?.income?.toLocaleString('de-DE') +
                  ' uzs' || 'Данных нет'}
              </p>
            </div>
          )}
          <div className="outcome">
            <h3>Расход:</h3>
            <p>
              -
              {history?.total?.[type]?.outcome?.toLocaleString('de-DE') +
                ' uzs' || 'Данных нет'}
            </p>
          </div>
        </div>
        {history?.history?.[type]?.dailySummary?.map((item, index) => (
          <DayStats key={index} item={item} />
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Dialog
        maxWidth={'md'}
        open={open}
        onClose={() => handleClose(false)}
        fullScreen={fullScreen}
      >
        <div className="exitModal">
          <div className="exitModalWarningIcon"></div>
          <form action="" onSubmit={(e) => createIncome(e)}>
            <div className="leftCreateRentModal">
              <div className="modalItem">
                <label htmlFor="">Новый доход *</label>
                <input
                  type="number"
                  placeholder="Общая сумма (сум)"
                  required
                  name="amount"
                />
              </div>
              <div className="modalItem">
                <label htmlFor="">Владелец *</label>
                <select name="owner" id="" required>
                  <option value="" hidden>
                    Выберите владельца
                  </option>
                  {Object.keys(OWNER).map((key, index) => (
                    <option value={key} key={index}>
                      {OWNER[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rightCreateRentModal">
              <div className="modalItem">
                <label htmlFor="">Комментарий *</label>
                <textarea
                  required
                  name="comment"
                  cols="30"
                  rows="6"
                  placeholder="Введите комментарий"
                ></textarea>
              </div>
              <div className="modalItem">
                <div className="actionsModal">
                  <button type="button" onClick={() => handleClose(false)}>
                    Отмена
                  </button>
                  <button type="submit">Создать</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Dialog>
      <Dialog
        maxWidth={'md'}
        open={openCreateOutcome}
        onClose={() => handleCloseCreateOutcome(false)}
        fullScreen={fullScreen}
      >
        <div className="exitModal">
          <div className="exitModalWarningIcon"></div>
          <form action="" onSubmit={(e) => createOutcome(e)}>
            <div className="leftCreateRentModal">
              <div className="modalItem">
                <label htmlFor="">Новый расход *</label>
                <input
                  type="number"
                  placeholder="Общая сумма (сум)"
                  required
                  name="amount"
                />
              </div>
              <div className="modalItem">
                <label htmlFor="">Владелец *</label>
                <select name="owner" id="" required>
                  <option value="" hidden>
                    Выберите владельца
                  </option>
                  {Object.keys(OWNER).map((key, index) => (
                    <option value={key} key={index}>
                      {OWNER[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="rightCreateRentModal">
              <div className="modalItem">
                <label htmlFor="">Комментарий *</label>
                <textarea
                  required
                  name="comment"
                  cols="30"
                  rows="6"
                  placeholder="Введите комментарий"
                ></textarea>
              </div>
              <div className="modalItem">
                <div className="actionsModal">
                  <button
                    type="button"
                    onClick={() => handleCloseCreateOutcome(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit">Создать</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Dialog>
      <Header />
      {role === 'admin' && (
        <section className="general">
          <div className="container">
            <div className="generalHeading">
              <h2>Общие показатели</h2>
            </div>
            <div className="generalInfo">
              {sum ? (
                <>
                  <div className="infoCol">
                    <h3 className="blue">Заработано за месяц на аренде</h3>
                    <p>
                      {sum?.rentIncome?.toLocaleString('de-DE') + ' uzs' ||
                        'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="green">Другие доходы</h3>
                    <p>
                      {sum?.income?.toLocaleString('de-DE') + ' uzs' ||
                        'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="red">Потрачено за месяц</h3>
                    <p>
                      {sum?.outcome?.toLocaleString('de-DE') + ' uzs' ||
                        'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="blue">Заработано за месяц</h3>
                    <p>
                      {sum?.total?.toLocaleString('de-DE') + ' uzs' ||
                        'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="red">Залог наличными</h3>
                    <p>
                      {sum.cash_pledge
                        ? sum.cash_pledge.toLocaleString('de-DE') + ' uzs'
                        : 'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="red">Залог по карте</h3>
                    <p>
                      {sum.card_pledge
                        ? sum.card_pledge.toLocaleString('de-DE') + ' uzs'
                        : 'Данных нет'}
                    </p>
                  </div>
                  <div className="infoCol">
                    <h3 className="red">Общий долг</h3>
                    <p>
                      {sum.duty
                        ? sum.duty.toLocaleString('de-DE') + ' uzs'
                        : 'Данных нет'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="infoCol">
                    <Skeleton variant="text" width={200} height={50} />
                  </div>
                  <div className="infoCol">
                    <Skeleton variant="text" width={200} height={50} />
                  </div>
                  <div className="infoCol">
                    <Skeleton variant="text" width={200} height={50} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}
      <section className="monitoring">
        <div className="container">
          <div className="monitoringHeading">
            <h2>Мониторинг</h2>
            <div className="partnerActions">
              {role === 'admin' && (
                <button
                  onClick={() => {
                    setOpen(true)
                  }}
                >
                  Добавить Доход
                </button>
              )}
              <button
                onClick={() => {
                  setOpenCreateOutcome(true)
                }}
                style={{ backgroundColor: '#e13333' }}
              >
                Добавить Расход
              </button>
            </div>
          </div>
          <div className="partnerWrapper">
            <PartnerItem
              title="Шохрух"
              income={ownersIncome?.adminIncome}
              history={history}
              type="admin"
            />
            <PartnerItem
              title="Партнер"
              income={ownersIncome?.partnerIncome}
              history={history}
              type="partner"
            />
            <PartnerItem
              title="Инвестор"
              income={ownersIncome?.investorIncome}
              history={history}
              type="investor"
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '1rem',
            }}
          >
            <Pagination count={10} page={page} onChange={handleChange} />
          </div>
        </div>
      </section>
    </>
  )
}

export default Monitoring
