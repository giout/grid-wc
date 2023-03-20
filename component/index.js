class Grid extends HTMLElement
{
    // Properties es un objeto vacio por defecto.
    constructor(properties = {})
    {
        super();
        this.properties = properties;
        this._pages = []; // Lista de grillas.
        this._indexPage = 0; // Indice de la pagina.
        this._currentRow = 0; // Contador de fila actual.

        if (this.properties.title == undefined) this.properties.title = "";

        // La grilla tiene por defecto la barra de controles sin columna de items.
        if (this.properties.showBar == undefined) this.properties.showBar = true;
        if (this.properties.showItem == undefined) this.properties.showItem = false;

        // Se agrega la columna item.
        if (this.properties.showItem) 
        {
            this.properties.columns.unshift("item");
            this._itemCount = 1;
        }

        // Por defecto, la grilla tiene 5 filas y 1 columna por pagina.
        if (this.properties.rows == undefined) this.properties.rows = 5;
        if (this.properties.columns == undefined) this.properties.columns = [""];

        this._defaultStyle();

        // Contenedor
        this._container = document.createElement("div");
        this._container.className = "_container";

        // Titulo
        this._divTitle = document.createElement("div");
        this._divTitle.className = "_title _border";
        this._divTitle.innerHTML = this.properties.title;

        // Barra de controles
        if (this.properties.showBar)
        { 
            const bt = document.createElement("template");
            bt.innerHTML = 
            `<div class="_control">
                <button class="_bar _button _border"><<</button>
                <button class="_bar _button _border"><</button>
                <div class="_bar _page _border"></div>
                <button class="_bar _button _border">></button>
                <button class="_bar _button _border">>></button>
            </div>`;

            this._bar = bt.content.cloneNode(true).querySelector("._control");
            const barElements = this._bar.getElementsByClassName("_bar"); // 4 botones y guia.
            
            // Guia de paginas
            this._guide = barElements[2];
            
            // Botones
            barElements[0].addEventListener("click", e => this.firstPage());
            barElements[1].addEventListener("click", e => this.previousPage());
            barElements[3].addEventListener("click", e => this.nextPage());
            barElements[4].addEventListener("click", e => this.lastPage());

            for (let i=0; i<barElements.length; i++)
            {
                barElements[i].style.fontSize = `${this.properties.barFontSize}px`;
                barElements[i].style.color = this.properties.barFontColor;
                barElements[i].style.backgroundColor = this.properties.barBackColor;
                barElements[i].style.border = `solid ${this.properties.borderColor} ${this.properties.borderSize}px`;
            }

            // Se ajustan los porcentajes de filas del contenedor y se agrega.
            this._container.style.gridTemplateRows = "20% 70% 10%";
        } 

        // Agregando estilos.
        this._container.style.width = `${this.properties.size}px`;
        this._container.style.height = `${this.properties.size}px`;

        this._divTitle.style.fontSize = `${this.properties.titleFontSize}px`;
        this._divTitle.style.backgroundColor = `${this.properties.titleBackColor}`;
        this._divTitle.style.color = `${this.properties.titleFontColor}`;

    }

    connectedCallback()
    {
        // En caso de que aun no se hayan insertado datos, se agrega la primera pagina o grilla.
        if (this._pages.length==0) this._pages.push(this._setGrid());  

        this.appendChild(this._container);
        this._container.appendChild(this._divTitle);
        this._container.appendChild(this._pages[this._indexPage]);  
        this._container.appendChild(this._bar);
    }

    // Recibe un array de objetos y lo agrega a la grilla.
    addRows(array)
    {
        for (let i=0; i<array.length; i++)
        {
            this._addData(array[i]);
        }
    }

    firstPage()
    {
        this._indexPage = 0;
        this._switchPage(this._pages[this._indexPage]);  
        this._updateGuide();   
    }

    previousPage()
    {
        // Se comprueba que la pagina actual no sea la primera.
        if (this._indexPage > 0) this._indexPage--;
        this._switchPage(this._pages[this._indexPage]);
        this._updateGuide();
    }

    nextPage()
    {
        // Se comprueba que la pagina actual no sea la ultima.
        if (this._indexPage < this._pages.length-1) this._indexPage++;
        this._switchPage(this._pages[this._indexPage]);
        this._updateGuide();
    }

    lastPage()
    {
        this._indexPage = this._pages.length-1;
        this._switchPage(this._pages[this._indexPage]);
        this._updateGuide();
    }

    // Cargar al grid archivos de json locales.
    loadJSON(path)
    {
        // Se solicita el archivo JSON.
        fetch(path)
        .then(response => response.json())
        .then(data => this.addRows(data));
    }

    // Establece las caracteristicas de cada grilla.
    _setGrid()
    {
        const box = document.createElement("div");
        box.className = "_box _border";

        box.style.gridTemplateColumns = `repeat(${this.properties.columns.length}, 1fr)`;

        // 0.5fr es la porcion que ocupa el titulo de la columna.
        box.style.gridTemplateRows = `0.5fr repeat(${this.properties.rows}, 1fr)`;

        // Estableciendo titulos de columnas de cada grilla.
        this._addCells(box, this.properties.columns);

        // Agregando estilos.
        box.style.border = `solid ${this.properties.borderColor} ${this.properties.borderSize}px`;

        return box;
    }

    // Recibe un array y agrega los datos a la grilla.
    _addData(values)
    {
        // Si se agregan datos al componente antes de ser conectado al DOM, la lista de paginas estara vacia y se detendra la ejecucion de la aplicacion.
        if (this._pages.length==0) this._pages.push(this._setGrid());

        // Se verifica que la actual fila sea mayor al maximo numero de filas.
        if (this._currentRow >= this.properties.rows)
        {
            // Se reinicia el contador de filas y se agrega una nueva grilla al contenedor. A esta se agregaran los siguientes datos.
            this._currentRow = 0;
            this._pages.push(this._setGrid());
        }   

        // Se agrega al inicio del array de valores.
        if (this.properties.showItem)
        {
            values.unshift(this._itemCount);
            this._itemCount++;
        }

        // Se agrega una fila.
        this._currentRow++;

        // Se agregan los datos a la ultima grilla.
        let page = this._pages[this._pages.length-1];
        this._addCells(page, values);
        this._updateGuide(); 
    }

    // Toma como parametro un array y anade cada elemento del mismo a una fila del contenedor introducido.
    _addCells(container, data)
    {
        let cell; 
        for (let i=0; i<data.length; i++)
        {
            cell = document.createElement("div");
            cell.className = "_cell _border";
            cell.innerHTML = data[i];
            container.appendChild(cell);

            // Agregando estilos.
            cell.style.fontSize = `${this.properties.cellFontSize}px`;
            cell.style.color = this.properties.cellFontColor;
            cell.style.backgroundColor = this.properties.cellBackColor;
            cell.style.border = `solid ${this.properties.borderColor} ${this.properties.borderSize}px`;
        }
    }

    _switchPage(div)
    {
        this._removeAllChilds(this._container);
        this._container.appendChild(this._divTitle); // Se agrega titulo.
        this._container.appendChild(div); // Se despliega la grilla.
        if (this.properties.showBar) this._container.appendChild(this._bar);
    }

    // Metodo html desacoplado.
    _removeAllChilds(element)
    {
        if (element.hasChildNodes)
        {
            while(element.childNodes.length >= 1)
            {
                element.removeChild(element.firstChild);
            }
        }
    }

    // La guia que muestra en que pagina se encuentra y el total de las mismas.
    _updateGuide()
    {
        if (this.properties.showBar)
        {
            this._guide.innerHTML = `${this._indexPage+1} / ${this._pages.length}`;
        }
    }

    // Se encarga de dar un valor por defecto a todas las propiedades css no definidas en el parametro.
    _defaultStyle()
    {
        if (this.properties.size == undefined) this.properties.size = 400;
        this._defaultFont = this.properties.size * 0.05;

        // Titulo
        if (this.properties.titleBackColor == undefined) this.properties.titleBackColor = "black";
        if (this.properties.titleFontColor == undefined) this.properties.titleFontColor = "white";
        if (this.properties.titleFontSize == undefined) this.properties.titleFontSize = this._defaultFont + (this._defaultFont*0.5);

        // Celdas
        if (this.properties.cellBackColor == undefined) this.properties.cellBackColor = "white";
        if (this.properties.cellFontColor == undefined) this.properties.cellFontColor = "black"; 
        if (this.properties.cellFontSize == undefined) this.properties.cellFontSize = this._defaultFont;

        // Barra de controles
        if (this.properties.barBackColor == undefined) this.properties.barBackColor = "white";
        if (this.properties.barFontColor == undefined) this.properties.barFontColor = "black";
        if (this.properties.barFontSize == undefined) this.properties.barFontSize = this._defaultFont;

        // Bordes
        if (this.properties.borderColor == undefined) this.properties.borderColor = "black";
        if (this.properties.borderSize == undefined) this.properties.borderSize = 1;
    }
}

customElements.define("data-grid", Grid);