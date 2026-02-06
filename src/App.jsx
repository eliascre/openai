import { DateTime } from 'luxon'
import axios from 'axios'
import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [, setTick] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadCountries = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          'https://restcountries.com/v3.1/all?fields=name,cca2,timezones,flags',
          { signal: controller.signal },
        )

        const normalized = response.data
          .map((country) => ({
            name: country.name?.common ?? 'Pays inconnu',
            code: country.cca2 ?? 'N/A',
            flag: country.flags?.svg ?? country.flags?.png ?? '',
            timezones: country.timezones ?? [],
          }))
          .filter((country) => country.timezones.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

        setCountries(normalized)
        setError('')
      } catch (fetchError) {
        if (fetchError.name !== 'CanceledError') {
          setError("Impossible de charger la liste des pays. Vérifiez votre connexion.")
        }
      } finally {
        setLoading(false)
      }
    }

    loadCountries()

    return () => controller.abort()
  }, [])

  const filteredCountries = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()
    if (!trimmedQuery) {
      return countries
    }

    return countries.filter((country) => country.name.toLowerCase().includes(trimmedQuery))
  }, [countries, query])

  const formatTime = (timezone) => {
    const now = DateTime.now().setZone(timezone)
    if (!now.isValid) {
      return 'Fuseau invalide'
    }

    return now.setLocale('fr').toFormat("cccc d LLL yyyy 'à' HH:mm:ss")
  }

  return (
    <main className="app">
      <header className="hero">
        <h1>Heure de tous les pays 🌍</h1>
        <p>
          Consultez l&apos;heure en direct pour chaque pays (et tous ses fuseaux horaires) grâce à
          Luxon + Axios.
        </p>
      </header>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Rechercher un pays..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>{filteredCountries.length} pays affichés</span>
      </section>

      {loading && <p className="status">Chargement des pays...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <section className="grid">
          {filteredCountries.map((country) => (
            <article key={country.code + country.name} className="card">
              <div className="country-head">
                {country.flag && <img src={country.flag} alt={`Drapeau de ${country.name}`} />}
                <div>
                  <h2>{country.name}</h2>
                  <p>{country.code}</p>
                </div>
              </div>

              <ul>
                {country.timezones.map((timezone) => (
                  <li key={`${country.code}-${timezone}`}>
                    <strong>{timezone}</strong>
                    <span>{formatTime(timezone)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default App
