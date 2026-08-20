import React, { useState } from 'react';
import { MOCK_PRICES, MOCK_COMPLAINTS, MOCK_INCIDENTS } from '../data/mockData';
import { MapPin, Info, AlertTriangle, ScrollText, TableProperties, ShieldAlert } from 'lucide-react';

export const ExploreLocation: React.FC = () => {
  const locations = Array.from(new Set(MOCK_PRICES.map(p => p.location)));
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]);

  // Filters
  const cityPrices = MOCK_PRICES.filter(p => p.location === selectedLocation);
  const cityComplaints = MOCK_COMPLAINTS.filter(c => c.location === selectedLocation);
  const cityIncidents = MOCK_INCIDENTS.filter(i => i.location === selectedLocation);

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-brick-critical/10 text-brick-critical border-brick-critical/20';
      case 'HIGH': return 'bg-terracotta-high/10 text-terracotta-high border-terracotta-high/20';
      case 'MODERATE': return 'bg-amber-caution/10 text-amber-caution border-amber-caution/20';
      default: return 'bg-sage-low/10 text-sage-low border-sage-low/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <span className="text-xs uppercase font-semibold tracking-wider text-muted-clay bg-soft-olive px-3 py-1 rounded-full border border-warm-border">
          Reference Hub
        </span>
        <h1 className="mt-3 text-3xl font-bold font-sans text-ink-olive">
          Explore Destination Risk Bulletins
        </h1>
        <p className="mt-2 text-sm text-muted-clay max-w-lg mx-auto">
          Review active complaints, pricing benchmarks, and logged risk incidents for major travel destinations.
        </p>
      </div>

      {/* City Switcher */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
              selectedLocation === loc
                ? 'bg-olive-green text-cream-surface border-transparent shadow-soft-warm'
                : 'bg-cream-surface text-ink-olive border-warm-border hover:bg-soft-olive'
            }`}
          >
            <MapPin className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
            {loc}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Complaints & General Bulletin */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-soft-warm">
            <h2 className="text-lg font-bold text-ink-olive font-sans mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-caution" />
              General Risk Profile
            </h2>
            
            {cityComplaints.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-clay">
                No active service complaints on record for {selectedLocation}.
              </div>
            ) : (
              <div className="space-y-4">
                {cityComplaints.map((comp, idx) => (
                  <div key={idx} className="border border-warm-border rounded-xl p-4 bg-warm-beige/25">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-sm text-ink-olive">{comp.serviceType} Services</span>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${getSeverityBadgeColor(comp.severity)}`}>
                        {comp.severity} SEVERITY
                      </span>
                    </div>
                    <div className="text-xs text-muted-clay mb-2">
                      Total complaints registered: <strong className="text-ink-olive">{comp.complaintCount}</strong>
                    </div>
                    <h4 className="text-xs font-semibold text-ink-olive mb-1">Top reported patterns:</h4>
                    <ul className="list-disc list-inside text-xs text-muted-clay space-y-1">
                      {comp.topIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle and Right: Benchmark Rates and Incident Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benchmark Table Card */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-soft-warm">
            <h2 className="text-lg font-bold text-ink-olive font-sans mb-4 flex items-center">
              <TableProperties className="mr-2 h-5 w-5 text-olive-green" />
              Pricing Benchmarks
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-border text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-muted-clay uppercase bg-soft-olive-tint">
                    <th className="px-4 py-3 rounded-l-xl">Service</th>
                    <th className="px-4 py-3">Route Context / Scope</th>
                    <th className="px-4 py-3 text-right">Min</th>
                    <th className="px-4 py-3 text-right rounded-r-xl">Median (Ref)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-border">
                  {cityPrices.map((price, idx) => (
                    <tr key={idx} className="hover:bg-warm-beige/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-ink-olive">{price.serviceType}</td>
                      <td className="px-4 py-3 text-muted-clay">{price.routeContext}</td>
                      <td className="px-4 py-3 text-right text-muted-clay">{price.currency}{price.min}</td>
                      <td className="px-4 py-3 text-right font-bold text-olive-green">{price.currency}{price.median}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-[11px] text-muted-clay flex items-start space-x-1.5">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                These rates represent localized reference medians derived from traveler reports and official state tourism estimates. Large deviations may represent price gouging.
              </span>
            </div>
          </div>

          {/* Incidents Bulletin Card */}
          <div className="bg-cream-surface border border-warm-border rounded-2xl p-5 shadow-soft-warm">
            <h2 className="text-lg font-bold text-ink-olive font-sans mb-4 flex items-center">
              <ScrollText className="mr-2 h-5 w-5 text-brick-critical" />
              Recent Logged Incidents
            </h2>

            {cityIncidents.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-warm-border rounded-xl">
                <ShieldAlert className="mx-auto h-8 w-8 text-muted-clay mb-2 opacity-50" />
                <p className="text-sm text-ink-olive font-semibold">No recent incidents logged</p>
                <p className="text-xs text-muted-clay mt-1">No significant tourism disputes reported for {selectedLocation}.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cityIncidents.map((inc) => (
                  <div key={inc.id} className="border border-warm-border rounded-xl p-4 bg-cream-surface hover:-translate-y-0.5 transition-transform duration-150">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-olive-green bg-soft-olive px-2.5 py-0.5 rounded-full">
                          {inc.category}
                        </span>
                        <span className="text-[11px] text-muted-clay">{inc.date}</span>
                      </div>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${getSeverityBadgeColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-ink-olive">{inc.title}</h3>
                    <p className="text-xs text-muted-clay mt-1 leading-relaxed">{inc.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
