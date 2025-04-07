import { ProductDTO } from '@/dtos/ProductDTO';
import { from, Observable } from 'rxjs';

const BASE_PATH = "http://localhost:8080/"

export class BackendService {
    getProduct(ean: string): Observable<ProductDTO> {
        const url = BASE_PATH + 'product/' + encodeURIComponent(ean);
        return from(
            fetch(url).then(response => response.json())
        );
    }
}