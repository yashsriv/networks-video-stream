import { Pipe, PipeTransform } from '@angular/core';
import { SafeStyle, DomSanitizer } from '@angular/platform-browser';

import { Observable } from 'rxjs';
import { User } from '../models/user';

@Pipe({
  name: 'DP',
})
export class DPPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: User, args?: any): SafeStyle {
    const iitkhome = `http://home.iitk.ac.in/~${value.username}/dp`;
    const oaimage = `https://oa.cc.iitk.ac.in/Oa/Jsp/Photo/${value.roll}_0.jpg`;
    const url = `url("${iitkhome}"), url("${oaimage}")`;
    return this.sanitizer.bypassSecurityTrustStyle(url);
  }
}
