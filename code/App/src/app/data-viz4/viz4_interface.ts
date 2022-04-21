//Allow duplicate data structure to store
export interface PlayerByPosition {
    GK:Player[],
    FW:Player[],
    MF:Player[],
    DF:Player[],
}
//Adding OnField, we expect shallow copies between elements.
export interface Player {
    Name: string,
    Img: string,
    Pos: string[],
    Age: number,
    salary: number,
    OnField: boolean,
    id:number

}
//sum up player value per position and total, this will be easier to generate pie graph
export interface TotalValue {
    value: number;
    GK:number,
    MF:number,
    FW:number,
    DF:number,
}


export interface PieData {
    position: string;
    value: string;
  }


