state/
======
- **DEVE morar aqui**: Estado client-side global (Zustand). Apenas o minimo possivel (ex: sessao do usuario, filtros ativos).
- **NAO DEVE morar aqui**: Estado local que pertence a um componente (use useState para isso) ou requests (use services).
