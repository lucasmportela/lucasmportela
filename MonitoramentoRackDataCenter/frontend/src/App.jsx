import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Gauge,
  RotateCcw,
  Send,
  Thermometer,
} from "lucide-react";
import "./style.css";

const API_URL = "/api/monitoramento";

const INITIAL_MATRIX = [
  [25, 28, 30],
  [27, 29, 31],
  [26, 28, 30],
];

const createInitialValues = () => INITIAL_MATRIX.map((row) => [...row]);

function formatTemperature(value) {
  return `${Number(value).toFixed(1)} °C`;
}

export default function App() {
  const [temperatures, setTemperatures] = useState(createInitialValues);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalSensors = temperatures.flat().length;
  const filledSensors = temperatures
    .flat()
    .filter((value) => value !== "" && Number.isFinite(Number(value))).length;

  const averages = useMemo(
    () =>
      temperatures.map((rack) => {
        const values = rack.map(Number).filter(Number.isFinite);
        return values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;
      }),
    [temperatures]
  );

  function handleTemperatureChange(rackIndex, sensorIndex, value) {
    setTemperatures((current) =>
      current.map((rack, i) =>
        i === rackIndex
          ? rack.map((temperature, j) =>
              j === sensorIndex ? value : temperature
            )
          : rack
      )
    );
    setResult(null);
    setError("");
  }

  function resetForm() {
    setTemperatures(createInitialValues());
    setResult(null);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    const matrix = temperatures.map((rack) => rack.map(Number));

    if (
      matrix.some(
        (rack) =>
          rack.length !== 3 ||
          rack.some(
            (value) =>
              !Number.isFinite(value) || value < 10 || value > 90
          )
      )
    ) {
      setError("Informe valores numéricos entre 10 e 90 °C em todos os sensores.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matriz: matrix }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || "Não foi possível processar as temperaturas.");
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Não foi possível conectar à API. Verifique se o backend está em execução na porta 3001."
      );
    } finally {
      setLoading(false);
    }
  }

  const criticalTemperature = result?.maiorTemperatura ?? 0;
  const criticalRack = (result?.localizacao?.rack ?? 0) + 1;
  const criticalSensor = (result?.localizacao?.sensor ?? 0) + 1;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <Cpu size={30} />
          </div>
          <div>
            <h1>RACK MONITOR</h1>
            <span>SISTEMA DE MONITORAMENTO TÉRMICO</span>
          </div>
        </div>
        <div className="online-status">
          <span />
          API DE MONITORAMENTO
        </div>
      </header>

      <main className="container">
        <section className="welcome">
          <div>
            <span className="tag">PAINEL DE CONTROLE</span>
            <h2>Monitoramento de temperatura</h2>
            <p>
              Informe as temperaturas dos sensores para analisar as condições
              térmicas dos racks.
            </p>
          </div>
          <div className="operation">
            <span>FAIXA PERMITIDA</span>
            <strong>10 °C a 90 °C</strong>
          </div>
        </section>

        <section className="overview" aria-label="Resumo do monitoramento">
          <article className="overview-card">
            <Activity size={25} />
            <span>Racks monitorados</span>
            <strong>03</strong>
            <small>Todos os racks cadastrados</small>
          </article>
          <article className="overview-card">
            <Thermometer size={25} />
            <span>Sensores preenchidos</span>
            <strong>
              {filledSensors}/{totalSensors}
            </strong>
            <small>Leituras de temperatura</small>
          </article>
          <article className="overview-card">
            <Gauge size={25} />
            <span>Temperatura máxima</span>
            <strong>
              {result ? formatTemperature(result.maiorTemperatura) : "--"}
            </strong>
            <small>
              {result ? "Maior leitura recebida" : "Aguardando análise"}
            </small>
          </article>
        </section>

        <section className="monitor-section">
          <div className="section-title">
            <div>
              <span className="tag">ENTRADA DE DADOS</span>
              <h2>Leituras dos sensores</h2>
            </div>
            <span className="unit">Unidade: °C</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="racks-grid">
              {temperatures.map((rack, rackIndex) => (
                <article className="rack-card" key={rackIndex}>
                  <div className="rack-header">
                    <Cpu size={20} />
                    <h3>Rack {rackIndex + 1}</h3>
                    <span className="rack-status">3 sensores</span>
                  </div>

                  {rack.map((temperature, sensorIndex) => (
                    <div className="sensor" key={sensorIndex}>
                      <label htmlFor={`rack-${rackIndex}-sensor-${sensorIndex}`}>
                        Sensor {sensorIndex + 1}
                      </label>
                      <div className="input-wrapper">
                        <Thermometer size={17} />
                        <input
                          id={`rack-${rackIndex}-sensor-${sensorIndex}`}
                          type="number"
                          min="10"
                          max="90"
                          step="0.1"
                          required
                          value={temperature}
                          onChange={(event) =>
                            handleTemperatureChange(
                              rackIndex,
                              sensorIndex,
                              event.target.value
                            )
                          }
                          placeholder="Ex.: 25"
                        />
                        <span>°C</span>
                      </div>
                    </div>
                  ))}
                </article>
              ))}
            </div>

            <div className="actions">
              <button className="btn-primary" type="submit" disabled={loading}>
                <Send size={17} />
                {loading ? "Processando..." : "Analisar temperaturas"}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={resetForm}
                disabled={loading}
              >
                <RotateCcw size={17} />
                Restaurar valores
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message" role="alert">
              <AlertTriangle size={20} />
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="results" aria-live="polite">
            <div className="section-title">
              <div>
                <span className="tag">RESULTADO DA ANÁLISE</span>
                <h2>Relatório térmico</h2>
              </div>
              <span className="unit">Processamento concluído</span>
            </div>

            <div className={`critical-card ${result.alerta ? "alert" : "success"}`}>
              <div>
                <span>MAIOR TEMPERATURA REGISTRADA</span>
                <strong className={result.alerta ? "danger" : "normal"}>
                  {formatTemperature(criticalTemperature)}
                </strong>
                <p>
                  Localização: Rack {criticalRack}, Sensor {criticalSensor}
                </p>
              </div>
              {result.alerta ? (
                <AlertTriangle size={42} />
              ) : (
                <CheckCircle2 size={42} />
              )}
            </div>

            <div className={result.alerta ? "alert" : "success"}>
              {result.alerta ? (
                <AlertTriangle size={22} />
              ) : (
                <CheckCircle2 size={22} />
              )}
              <div>
                <strong>{result.alerta ? "Atenção: superaquecimento" : "Temperaturas normais"}</strong>
                <p>{result.mensagem}</p>
              </div>
            </div>

            <div className="result-grid">
              <article className="panel">
                <h3>Temperatura média por rack</h3>
                {result.medias.map((average, index) => (
                  <div className="mean-card" key={index}>
                    <span>Rack {index + 1}</span>
                    <strong>{formatTemperature(average)}</strong>
                  </div>
                ))}
              </article>

              <article className="panel">
                <h3>Matriz de temperaturas</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Rack</th>
                        <th>Sensor 1</th>
                        <th>Sensor 2</th>
                        <th>Sensor 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matriz.map((rack, rackIndex) => (
                        <tr key={rackIndex}>
                          <td>Rack {rackIndex + 1}</td>
                          {rack.map((temperature, sensorIndex) => {
                            const isCritical =
                              temperature >= 75 ||
                              (rackIndex === result.localizacao.rack &&
                                sensorIndex === result.localizacao.sensor);

                            return (
                              <td
                                key={sensorIndex}
                                className={isCritical ? "danger" : ""}
                              >
                                {formatTemperature(temperature)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </section>
        )}
      </main>

      <footer>
        <span>Rack Monitor · Sistema de monitoramento térmico</span>
        <span>Limite de alerta: 75 °C</span>
      </footer>
    </>
  );
}
