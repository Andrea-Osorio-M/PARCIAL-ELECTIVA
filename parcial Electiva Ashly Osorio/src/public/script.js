async function fetchJSON(url){ const res = await fetch(url); if(!res.ok) throw new Error('network'); return res.json(); }

async function populateDepartments(selectEl, includeEmpty=true){
  const depts = await fetchJSON('/api/departments');
  if(includeEmpty){ selectEl.innerHTML = '<option value="">-- Seleccione departamento --</option>'; }
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.code;
    opt.textContent = d.name;
    selectEl.appendChild(opt);
  });
}

async function populateDepartmentFilters(){
  const sel = document.getElementById('filterDepartamento');
  sel.innerHTML = '<option value="">Todos los departamentos</option>';
  const depts = await fetchJSON('/api/departments');
  depts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.code;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
}

async function populateTowns(deptCode, selectEl, includeEmpty=true){
  selectEl.innerHTML = includeEmpty ? '<option value="">-- Seleccione municipio --</option>' : '';
  if(!deptCode) return;
  const towns = await fetchJSON('/api/towns?department=' + deptCode);
  towns.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.code;
    opt.textContent = t.name;
    selectEl.appendChild(opt);
  });
}

async function loadRecords(filterDept='', filterTown=''){
  const params = new URLSearchParams();
  if(filterDept) params.set('departamento', filterDept);
  if(filterTown) params.set('municipio', filterTown);
  const url = '/api/records' + (params.toString() ? '?' + params.toString() : '');
  const records = await fetchJSON(url);
  renderRecords(records);
}

function renderRecords(records){
  const container = document.getElementById('recordsContainer');
  if(records.length === 0){ container.innerHTML = '<p>No hay registros.</p>'; return; }
  const rows = records.map(r => `<tr><td>${r.id}</td><td>${r.fecha}</td><td>${r.departamento}</td><td>${r.municipio}</td></tr>`).join('');
  container.innerHTML = `<table><thead><tr><th>ID</th><th>Fecha</th><th>Departamento (code)</th><th>Municipio (code)</th></tr></thead><tbody>${rows}</tbody></table>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const depSelect = document.getElementById('departamento');
  const munSelect = document.getElementById('municipio');
  const form = document.getElementById('registroForm');

  await populateDepartments(depSelect);
  await populateDepartmentFilters();

  depSelect.addEventListener('change', async (e)=>{
    await populateTowns(e.target.value, munSelect);
  });

  
  const filterDep = document.getElementById('filterDepartamento');
  const filterMun = document.getElementById('filterMunicipio');
  filterDep.addEventListener('change', async (e)=>{
    filterMun.innerHTML = '<option value="">Todos los municipios</option>';
    if(e.target.value){
      await populateTowns(e.target.value, filterMun, true);

      const top = document.createElement('option');
      top.value = '';
      top.textContent = 'Todos los municipios';
      filterMun.insertBefore(top, filterMun.firstChild);
    }
  });

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const data = {
      fecha: document.getElementById('fecha').value,
      departamento: depSelect.value,
      municipio: munSelect.value
    };
    try{
      const res = await fetch('/api/records', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      if(!res.ok) throw new Error('Error guardando');
      const saved = await res.json();
      alert('Registro guardado con id: ' + saved.id);
      form.reset();
      
      munSelect.innerHTML = '<option value="">-- Seleccione municipio --</option>';
      await loadRecords();
    }catch(e){
      alert('No se pudo guardar: ' + e.message);
    }
  });

  document.getElementById('applyFilter').addEventListener('click', async ()=>{
    await loadRecords(filterDep.value, filterMun.value);
  });
  document.getElementById('clearFilter').addEventListener('click', async ()=>{
    filterDep.value = '';
    filterMun.innerHTML = '<option value="">Todos los municipios</option>';
    await loadRecords();
  });

  await loadRecords();
});
