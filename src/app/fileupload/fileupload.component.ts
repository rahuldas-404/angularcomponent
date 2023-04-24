import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { FileuploadService } from 'src/app/fileupload.service';

import * as XLSX from 'xlsx';
import { xml2json } from 'xml-js';

import * as Papa from 'papaparse';

@Component({
  selector: 'app-fileupload',
  templateUrl: './fileupload.component.html',
  styleUrls: ['./fileupload.component.css']
})
export class FileuploadComponent implements OnInit {
  modulename=['Use case','Profile'];
  s!: string;
  isdisable=true;
  isselectdisable=true 
  filesize= 10000000;
  fileformat = ['text/csv', 'text/xml','xlsm','xlsx','application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12'];
  selectedFiles?:File | null=null;
  fileInput!:any;
  jsonData: any;
  constructor(private uploadService: FileuploadService ) { 
    this.jsonData = {};
  }

  ngOnInit(): void {
  }
  validate(event : any) : void{
    this.fileInput = document.getElementById('fi') as HTMLInputElement;
    const file = this.fileInput.files?.[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      console.log(reader.result);
    } 
    this.selectedFiles = file;
    if (!file || !this.fileformat.includes(file.type) ) {
      alert('Invalid file type. Only select CSV or XML files');
      this.fileInput.value='';
    }
    else if(file.size > this.filesize)
    {
      alert('Size should be less than 10 mb');
      this.fileInput.value='';
      this.selectedFiles=null;
    }
    else{
      this.isselectdisable=false;
      
    }
  }
  confirm(event : any) : void{
    this.isdisable=false;
  }

  upload(event : any) : void{
    
    this.isdisable=true;
    this.isselectdisable=true;
    if(!this.selectedFiles){
      alert('Please select the file!!!');
    }
    const filename=this.selectedFiles?.name;
    if (this.selectedFiles) {
      if(this.selectedFiles.type==='text/csv'){
        const file: File = event.target.files[0];
        if (file) {
          const reader: FileReader = new FileReader();
          reader.readAsText(file);
          reader.onload = (e) => {
            const csvData: string = reader.result as string;
            this.jsonData = Papa.parse(csvData, { header: true, skipEmptyLines: true }).data;
          };
        }
    }
      else if(this.selectedFiles.type==='text/xml'){
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file);
        
        const xmlData = reader.result as string;
        const options = { compact: true, ignoreComment: true, spaces: 4 };
        this.jsonData = xml2json(xmlData, options);
        
          
      }
      else if(this.selectedFiles.type==='application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const workbook: XLSX.WorkBook = XLSX.read(fileReader.result, { type: 'binary' });
          const sheetName: string = workbook.SheetNames[0];
          const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName];
          this.jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        };
        fileReader.readAsBinaryString(this.selectedFiles);
      }
      else if(this.selectedFiles.type==='application/vnd.ms-excel'|| 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'|| 'application/vnd.ms-excel.sheet.macroEnabled.12')
      {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(this.selectedFiles);

        fileReader.onload = () => {
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          this.jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });        }
      }

      this.uploadService.upload(this.jsonData,this.s).subscribe({
        next: (event: any) => {
         if (event instanceof HttpResponse) {
            alert('Uploaded the file successfully: ' + filename);
          }
        },
        error: (err: any) => {

          this.selectedFiles=null;
          this.fileInput.value='';
          alert('Could not upload the file: ' + filename);

        }
      });
    }
  }
}
