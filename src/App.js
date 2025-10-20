import React, { Component } from "react";
import "./App.css";
import * as d3 from "d3";

const STOP_WORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","at","by","from",
  "is","are","was","were","be","been","being","that","this","it","as","into","over",
  "up","down","out","about","between","through","there","their","them","they","you",
  "your","yours","i","me","my","we","our","ours","he","him","his","she","her","hers",
  "who","whom","which","what","when","where","why","how","not","no","yes","so","if",
  "also","very","just","than","then","too","can","could","should","would","will",
  "had","has","have","do","does","did","all","any","each","few","more","most","other",
  "some","such","only","own","same","both","every","because","while"
]);

export default class App extends Component {
  state = {
    text: "",
    wordFrequency: []
  };

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.wordFrequency !== this.state.wordFrequency) {
      this.renderChart();
    }
  }

  getWordFrequency = (text) => {
    const cleaned = text
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()"]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return [];
    const words = cleaned.split(" ").filter(w => w && !STOP_WORDS.has(w));
    const freq = words.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(freq);
  };

  handleInputChange = (e) => {
    this.setState({ text: e.target.value });
  };

  handleGenerate = () => {
    const freqs = this.getWordFrequency(this.state.text);
    this.setState({ wordFrequency: freqs });
  };

  renderChart() {
    const svg = d3.select(".svg_parent");
    const W = 1000;
    const H = 300;
    const margin = { top: 10, right: 20, bottom: 10, left: 20 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    svg.attr("width", W).attr("height", H);

    const g = svg.selectAll("g.chart")
      .data([null])
      .join("g")
      .attr("class", "chart")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const dataTop5 = [...this.state.wordFrequency]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count], i) => ({ word, count, rank: i }));

    if (dataTop5.length === 0) {
      g.selectAll("text.word").remove();
      return;
    }

    const counts = dataTop5.map(d => d.count);
    const minC = d3.min(counts);
    const maxC = d3.max(counts);

    const fontSize = d3.scaleLinear()
      .domain([minC, maxC])
      .range([20, 72])
      .nice();

    // Horizontal positioning (center all words)
    const totalFontWidth = d3.sum(dataTop5, d => 0.6 * fontSize(d.count) * d.word.length);
    const spacing = (innerW - totalFontWidth) / (dataTop5.length + 1);
    let cumulativeX = spacing;

    // Precompute each x/y position
    dataTop5.forEach(d => {
      d.font = fontSize(d.count);
      d.x = cumulativeX + 0.3 * d.font * d.word.length; // center of word
      d.y = innerH / 2; // same line
      cumulativeX += 0.6 * d.font * d.word.length + spacing;
    });

    const words = g.selectAll("text.word")
      .data(dataTop5, d => d.word);

    // ENTER
    const enterSel = words.enter()
      .append("text")
      .attr("class", "word")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .style("font-family", "sans-serif")
      .style("font-size", 0)
      .text(d => d.word);

    enterSel.transition()
      .duration(650)
      .style("font-size", d => `${d.font}px`);

    // UPDATE
    words.transition()
      .duration(700)
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .style("font-size", d => `${d.font}px`);

    // EXIT
    words.exit()
      .transition()
      .duration(400)
      .style("font-size", "0px")
      .style("opacity", 0)
      .remove();
  }

  render() {
    return (
      <div className="parent">
        <div className="child1">
          <textarea
            id="input_field"
            style={{ height: 150, width: 1000 }}
            value={this.state.text}
            onChange={this.handleInputChange}
            placeholder="Paste your text here..."
          />
          <button
            type="button"
            style={{ marginTop: 10, height: 40, width: 1000 }}
            onClick={this.handleGenerate}
          >
            Generate WordCloud
          </button>
        </div>

        <div className="child2">
          <svg className="svg_parent" style={{ display: "block", margin: "0 auto", background: "#e6e6e6" }} />
        </div>
      </div>
    );
  }
}
