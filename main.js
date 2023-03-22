const grid = new Grid({title: "Grid", columns: ["key", "value"], rows: 4});
const container = document.getElementById("container");
container.appendChild(grid);

grid.addRows([["one", "1"], ["two", "2"]]);